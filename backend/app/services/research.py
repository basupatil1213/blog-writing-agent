"""Tavily-based web research service."""
from __future__ import annotations

import json
from typing import List


def tavily_search(query: str, max_results: int = 5) -> List[dict]:
    """
    Run a single Tavily query and return a list of normalised result dicts.

    Each dict contains: title, url, snippet, published_at, source.
    """
    from langchain_tavily import TavilySearch  # lazy import – optional dependency

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
