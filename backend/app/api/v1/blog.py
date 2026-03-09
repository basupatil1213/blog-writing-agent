"""Blog generation API endpoint with Server-Sent Events streaming."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.api import BlogGenerateRequest
from app.services.blog_service import generate_blog_stream

router = APIRouter()


@router.post(
    "/generate",
    summary="Generate a blog post (SSE stream)",
    description=(
        "Accepts a topic, runs the LangGraph blog-writing agent, and streams "
        "Server-Sent Events (SSE) for progress + the final blog in Markdown."
    ),
    response_class=StreamingResponse,
)
async def generate_blog(request: BlogGenerateRequest) -> StreamingResponse:
    """
    SSE event shapes emitted on the stream::

        data: {"type": "progress", "step": "router",   "message": "…"}
        data: {"type": "progress", "step": "worker",   "message": "…"}
        …
        data: {"type": "complete", "title": "…", "blog_kind": "…", "mode": "…",
               "needs_research": true, "evidence_count": 5, "section_count": 7,
               "content": "# Blog title\\n\\n…"}
        data: {"type": "error", "message": "…"}   <- only on failure
    """
    if not request.topic.strip():
        raise HTTPException(status_code=422, detail="Topic must not be blank.")

    topic = request.topic
    as_of = request.resolved_as_of()

    async def _event_generator():
        # Immediate heartbeat so the browser doesn't time out on slow starts
        yield "data: " + json.dumps(
            {"type": "progress", "step": "queued", "message": "🚀 Blog generation started…"}
        ) + "\n\n"

        # generate_blog_stream is an async generator function — call without await
        async for event in generate_blog_stream(topic=topic, as_of=as_of):
            yield "data: " + json.dumps(event) + "\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
