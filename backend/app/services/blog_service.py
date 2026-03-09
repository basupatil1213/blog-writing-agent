"""High-level blog generation service.

This is the single entry-point that the API layer calls.  It wraps the
compiled LangGraph graph, runs it in a thread-pool executor (so FastAPI's
async event-loop stays unblocked), and streams SSE-compatible progress
events back to callers via an asyncio.Queue.

The graph is streamed with ``stream_mode="updates"`` so we capture:
  - Per-node progress events (emitted immediately)
  - All state keys we need for the final "complete" event
  …all in a SINGLE graph execution pass.
"""
from __future__ import annotations

import asyncio
from datetime import date
from typing import AsyncIterator, List, Optional

from app.graph.builder import graph
from app.schemas.agent import Plan, State


# ── Human-readable progress messages per node name ────────────────────────────

_NODE_MESSAGES: dict[str, str] = {
    "router": "🔍 Analysing topic and deciding research strategy…",
    "research": "🌐 Fetching and synthesising web evidence…",
    "orchestrator": "📝 Planning blog structure and sections…",
    "worker": "✍️  Writing blog sections in parallel…",
    "merge_content": "📎 Merging sections into a single document…",
    "decide_images": "🖼️  Deciding where to place diagrams…",
    "generate_and_place_images": "🎨 Generating images and embedding them…",
    "reducer": "🔧 Assembling and enhancing the final blog…",
}


# ── Initial state factory ─────────────────────────────────────────────────────


def _make_initial_state(topic: str, as_of: str) -> State:
    return {
        "topic": topic,
        "mode": "",
        "needs_research": False,
        "queries": [],
        "evidence": [],
        "plan": None,
        "as_of": as_of,
        "recency_days": 7,
        "sections": [],
        "merged_md": "",
        "md_with_placeholders": "",
        "image_specs": [],
        "final": "",
    }


# ── Key state accumulator ─────────────────────────────────────────────────────


class _StateAccumulator:
    """Collect the pieces we need from stream updates – no double invocation."""

    def __init__(self) -> None:
        self.mode: str = ""
        self.needs_research: bool = False
        self.evidence_count: int = 0
        self.plan: Optional[Plan] = None
        self.final_md: str = ""

    def absorb(self, node_name: str, update: dict) -> None:  # noqa: C901
        if not isinstance(update, dict):
            return
        if "mode" in update:
            self.mode = update["mode"]
        if "needs_research" in update:
            self.needs_research = update["needs_research"]
        if "evidence" in update:
            evidence = update["evidence"] or []
            self.evidence_count = len(evidence)
        if "plan" in update and update["plan"] is not None:
            raw = update["plan"]
            self.plan = Plan(**raw) if isinstance(raw, dict) else raw
        if "final" in update and update["final"]:
            self.final_md = update["final"]
        # reducer subgraph surfaces its output under the "reducer" key
        if node_name == "reducer" and isinstance(update, dict):
            inner = update  # may be the subgraph's last node output
            if "final" in inner and inner["final"]:
                self.final_md = inner["final"]
            if "plan" in inner and inner["plan"] is not None:
                raw = inner["plan"]
                self.plan = Plan(**raw) if isinstance(raw, dict) else raw


# ── Streaming generator ───────────────────────────────────────────────────────


async def generate_blog_stream(
    topic: str,
    as_of: Optional[str] = None,
) -> AsyncIterator[dict]:
    """
    Async generator that yields SSE-compatible event dicts.

    Event shapes:
      {"type": "progress", "step": str, "message": str}
      {"type": "complete", "title": str, "blog_kind": str, "mode": str,
       "needs_research": bool, "evidence_count": int, "section_count": int,
       "content": str}
      {"type": "error", "message": str}
    """
    resolved_as_of = as_of or date.today().isoformat()
    initial_state = _make_initial_state(topic, resolved_as_of)

    event_queue: asyncio.Queue[Optional[dict]] = asyncio.Queue()
    loop = asyncio.get_running_loop()  # always safe inside an async context

    def _put(event: Optional[dict]) -> None:
        loop.call_soon_threadsafe(event_queue.put_nowait, event)

    def _run_sync() -> None:
        acc = _StateAccumulator()
        try:
            seen_worker = False

            for chunk in graph.stream(initial_state, stream_mode="updates"):
                for node_name, update in chunk.items():
                    acc.absorb(node_name, update)

                    # Collapse N parallel worker completions → one progress event
                    if node_name == "worker":
                        if not seen_worker:
                            seen_worker = True
                            _put(
                                {
                                    "type": "progress",
                                    "step": node_name,
                                    "message": _NODE_MESSAGES[node_name],
                                }
                            )
                    else:
                        _put(
                            {
                                "type": "progress",
                                "step": node_name,
                                "message": _NODE_MESSAGES.get(
                                    node_name, f"Running {node_name}…"
                                ),
                            }
                        )

            plan = acc.plan
            if plan is None:
                raise RuntimeError("Graph finished without producing a Plan.")

            _put(
                {
                    "type": "complete",
                    "title": plan.blog_title,
                    "blog_kind": plan.blog_kind,
                    "mode": acc.mode,
                    "needs_research": acc.needs_research,
                    "evidence_count": acc.evidence_count,
                    "section_count": len(plan.tasks),
                    "content": acc.final_md,
                }
            )
        except Exception as exc:
            _put({"type": "error", "message": str(exc)})
        finally:
            _put(None)  # sentinel — signals the async side to stop

    asyncio.create_task(asyncio.to_thread(_run_sync))

    while True:
        event = await event_queue.get()
        if event is None:
            break
        yield event
