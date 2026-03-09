"""Singleton LLM instance shared across the application."""
from __future__ import annotations

from typing import Optional

from langchain_openai import ChatOpenAI

from app.core.config import settings

_llm_instance: Optional[ChatOpenAI] = None


def get_llm() -> ChatOpenAI:
    """Return the singleton ChatOpenAI instance, creating it on first call."""
    global _llm_instance
    if _llm_instance is None:
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. "
                "Copy .env.example to .env and fill in your credentials."
            )
        _llm_instance = ChatOpenAI(
            model=settings.openai_model_name,
            api_key=settings.openai_api_key,
        )
    return _llm_instance


# Convenience alias — modules that import `llm` directly will call get_llm()
# lazily via this proxy property pattern.
class _LLMProxy:
    """Proxy that forwards every attribute access to the real LLM instance."""

    def __getattr__(self, name: str):  # type: ignore[override]
        return getattr(get_llm(), name)

    def __call__(self, *args, **kwargs):
        return get_llm()(*args, **kwargs)

    def invoke(self, *args, **kwargs):
        return get_llm().invoke(*args, **kwargs)

    def with_structured_output(self, *args, **kwargs):
        return get_llm().with_structured_output(*args, **kwargs)


llm: ChatOpenAI = _LLMProxy()  # type: ignore[assignment]

