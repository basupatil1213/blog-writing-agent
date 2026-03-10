"""All LangGraph node functions for the blog-writing agent."""
from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Callable, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.llm import llm
from app.schemas.agent import (
    EvidenceItem,
    EvidencePack,
    GlobalImagePlan,
    Plan,
    RouterDecision,
    State,
    Task,
)
from app.graph.prompts import (
    DECIDE_IMAGES_SYSTEM,
    ORCHESTRATOR_SYSTEM,
    RESEARCH_SYSTEM,
    ROUTER_SYSTEM,
    WORKER_SYSTEM,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _iso_to_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except Exception:
        return None


def _tavily_search(query: str, max_results: int = 5) -> List[dict]:
    """Run a single Tavily query and return normalised result dicts."""
    from langchain_tavily import TavilySearch  # lazy import

    tool = TavilySearch(max_results=max_results)
    raw_response = tool.invoke({"query": query})

    try:
        results = json.loads(raw_response)
    except (json.JSONDecodeError, TypeError):
        return []

    normalised: List[dict] = []
    for r in results:
        normalised.append(
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", ""),
                "published_at": r.get("published_date"),
                "source": r.get("source"),
            }
        )
    return normalised


# ── Graph nodes ───────────────────────────────────────────────────────────────


def router_node(state: State) -> dict:
    """Decide whether research is needed and what mode to use."""
    decider = llm.with_structured_output(RouterDecision)
    decision: RouterDecision = decider.invoke(
        [
            SystemMessage(content=ROUTER_SYSTEM),
            HumanMessage(content=f"Topic: {state['topic']}\nAs-of date: {state['as_of']}"),
        ]
    )

    recency_days: int
    if decision.mode == "open_book":
        recency_days = 7
    elif decision.mode == "hybrid":
        recency_days = 45
    else:
        recency_days = 3650

    return {
        "needs_research": decision.needs_research,
        "mode": decision.mode,
        "queries": decision.queries,
        "recency_days": recency_days,
    }


def route_next(state: State) -> str:
    """Conditional edge: go to research or jump straight to orchestrator."""
    return "research" if state["needs_research"] else "orchestrator"


def research_node(state: State) -> dict:
    """Fetch web evidence for the topic using Tavily."""
    queries = (state.get("queries") or [])[:10]
    max_results = 6

    raw_results: List[dict] = []
    for q in queries:
        raw_results.extend(_tavily_search(q, max_results=max_results))

    if not raw_results:
        return {"evidence": []}

    extractor = llm.with_structured_output(EvidencePack)
    pack: EvidencePack = extractor.invoke(
        [
            SystemMessage(content=RESEARCH_SYSTEM),
            HumanMessage(
                content=(
                    f"As-of date: {state['as_of']}\n"
                    f"Recency days: {state['recency_days']}\n\n"
                    f"Raw results:\n{raw_results}"
                )
            ),
        ]
    )

    # Deduplicate by URL
    dedup: dict[str, EvidenceItem] = {}
    for item in pack.evidence:
        if item.url:
            dedup[item.url] = item

    evidence = list(dedup.values())

    # Hard recency filter for open_book mode
    mode = state.get("mode", "closed_book")
    if mode == "open_book":
        as_of_dt = date.fromisoformat(state["as_of"])
        cutoff = as_of_dt - timedelta(days=int(state["recency_days"]))
        fresh: List[EvidenceItem] = [
            e for e in evidence if (d := _iso_to_date(e.published_at)) and d >= cutoff
        ]
        evidence = fresh

    return {"evidence": evidence}


def orchestrator_node(state: State) -> dict:
    """Plan the blog structure based on topic, mode, and evidence."""
    planner = llm.with_structured_output(Plan)
    evidence = state.get("evidence") or []
    mode = state.get("mode", "closed_book")
    forced_kind = "news_roundup" if mode == "open_book" else None

    plan: Plan = planner.invoke(
        [
            SystemMessage(content=ORCHESTRATOR_SYSTEM),
            HumanMessage(
                content=(
                    f"Topic: {state['topic']}\n"
                    f"Mode: {mode}\n"
                    f"As-of: {state['as_of']} (recency_days={state['recency_days']})\n"
                    f"{'Force blog_kind=news_roundup' if forced_kind else ''}\n\n"
                    f"Evidence (ONLY use for fresh claims; may be empty):\n"
                    f"{[e.model_dump() for e in evidence][:16]}\n\n"
                    "Instruction: If mode=open_book, your plan must NOT drift into a tutorial."
                )
            ),
        ]
    )

    if forced_kind:
        plan.blog_kind = "news_roundup"

    return {"plan": plan}


def fanout(state: State):
    """Fan-out: dispatch each section to a worker node in parallel."""
    from langgraph.types import Send  # lazy import keeps graph module lean

    assert state["plan"] is not None
    return [
        Send(
            "worker",
            {
                "task": task.model_dump(),
                "topic": state["topic"],
                "mode": state["mode"],
                "as_of": state["as_of"],
                "recency_days": state["recency_days"],
                "plan": state["plan"].model_dump(),
                "evidence": [e.model_dump() for e in (state.get("evidence") or [])],
            },
        )
        for task in state["plan"].tasks
    ]


def worker_node(payload: dict) -> dict:
    """Write a single blog section as Markdown."""
    task = Task(**payload["task"])
    plan = Plan(**payload["plan"])
    evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]
    topic: str = payload["topic"]
    mode: str = payload.get("mode", "closed_book")
    as_of: str = payload.get("as_of", "")
    recency_days: int = payload.get("recency_days", 3650)

    bullets_text = "\n- " + "\n- ".join(task.bullets)

    evidence_text = (
        "\n".join(
            f"- {e.title} | {e.url} | {e.published_at or 'date:unknown'}"
            for e in evidence[:20]
        )
        if evidence
        else ""
    )

    section_md: str = llm.invoke(
        [
            SystemMessage(content=WORKER_SYSTEM),
            HumanMessage(
                content=(
                    f"Blog title: {plan.blog_title}\n"
                    f"Audience: {plan.audience}\n"
                    f"Tone: {plan.tone}\n"
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Constraints: {plan.constraints}\n"
                    f"Topic: {topic}\n"
                    f"Mode: {mode}\n"
                    f"As-of: {as_of} (recency_days={recency_days})\n\n"
                    f"Section title: {task.title}\n"
                    f"Goal: {task.goal}\n"
                    f"Target words: {task.target_words}\n"
                    f"Tags: {task.tags}\n"
                    f"requires_research: {task.requires_research}\n"
                    f"requires_citations: {task.requires_citations}\n"
                    f"requires_code: {task.requires_code}\n"
                    f"Bullets:{bullets_text}\n\n"
                    f"Evidence (ONLY use these URLs when citing):\n{evidence_text}\n"
                )
            ),
        ]
    ).content.strip()

    return {"sections": [(task.id, section_md)]}


# ── Reducer sub-graph nodes ───────────────────────────────────────────────────


def merge_content(state: State) -> dict:
    """Merge all parallel sections into a single ordered Markdown document."""
    plan = state["plan"]
    assert plan is not None

    ordered = [md for _, md in sorted(state["sections"], key=lambda x: x[0])]
    body = "\n\n".join(ordered).strip()
    merged_md = f"# {plan.blog_title}\n\n{body}\n"
    return {"merged_md": merged_md}


def decide_images(state: State) -> dict:
    """Ask the LLM whether diagrams/images should be inserted and where."""
    planner = llm.with_structured_output(GlobalImagePlan)
    plan = state["plan"]
    assert plan is not None

    image_plan: GlobalImagePlan = planner.invoke(
        [
            SystemMessage(content=DECIDE_IMAGES_SYSTEM),
            HumanMessage(
                content=(
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Topic: {state['topic']}\n\n"
                    "Insert placeholders + propose image prompts.\n\n"
                    f"{state['merged_md']}"
                )
            ),
        ]
    )

    return {
        "md_with_placeholders": image_plan.md_with_placeholders,
        "image_specs": [img.model_dump() for img in image_plan.images],
    }


def generate_and_place_images(state: State) -> dict:
    """Generate images via Gemini and embed them into the Markdown.

    Images are uploaded via the configured storage backend (MinIO or local
    filesystem). The public URL returned by the backend is embedded in markdown.
    """
    from app.services.image_gen import GeminiImageService  # lazy import
    from app.services.storage import get_storage  # lazy import

    plan = state["plan"]
    assert plan is not None

    md: str = state.get("md_with_placeholders") or state["merged_md"]
    image_specs: List[dict] = state.get("image_specs") or []

    if not image_specs:
        return {"final": md}

    storage = get_storage()
    image_svc = GeminiImageService()

    for spec in image_specs:
        placeholder: str = spec["placeholder"]
        filename: str = spec["filename"]

        try:
            if not storage.exists(filename):
                img_bytes = image_svc.generate(spec["prompt"])
                public_url = storage.upload(filename, img_bytes)
            else:
                # Derive URL without re-uploading
                from app.services.storage import LocalStorageBackend, MinIOStorageBackend
                if isinstance(storage, MinIOStorageBackend):
                    scheme = "https" if settings.minio_secure else "http"
                    base = settings.minio_public_url or f"{scheme}://{settings.minio_endpoint}"
                    public_url = f"{base}/{settings.minio_bucket}/{filename}"
                else:
                    public_url = f"/images/{filename}"
        except Exception as exc:
            prompt_block = (
                f"> **[IMAGE GENERATION FAILED]** {spec.get('caption', '')}\n>\n"
                f"> **Alt:** {spec.get('alt', '')}\n>\n"
                f"> **Prompt:** {spec.get('prompt', '')}\n>\n"
                f"> **Error:** {exc}\n"
            )
            md = md.replace(placeholder, prompt_block)
            continue

        img_md = f"![{spec['alt']}]({public_url})\n*{spec['caption']}*"
        md = md.replace(placeholder, img_md)

    return {"final": md}
