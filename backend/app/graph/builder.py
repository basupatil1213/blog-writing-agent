"""Build and compile the LangGraph agent."""
from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app.schemas.agent import State
from app.graph.nodes import (
    decide_images,
    fanout,
    generate_and_place_images,
    merge_content,
    orchestrator_node,
    research_node,
    route_next,
    router_node,
    worker_node,
)


def _build_reducer_subgraph() -> StateGraph:
    """Inner subgraph: merge sections → decide images → generate images."""
    sg = StateGraph(State)
    sg.add_node("merge_content", merge_content)
    sg.add_node("decide_images", decide_images)
    sg.add_node("generate_and_place_images", generate_and_place_images)

    sg.add_edge(START, "merge_content")
    sg.add_edge("merge_content", "decide_images")
    sg.add_edge("decide_images", "generate_and_place_images")
    sg.add_edge("generate_and_place_images", END)

    return sg.compile()


def build_graph():
    """Build and compile the main LangGraph pipeline."""
    reducer_subgraph = _build_reducer_subgraph()

    g = StateGraph(State)
    g.add_node("router", router_node)
    g.add_node("research", research_node)
    g.add_node("orchestrator", orchestrator_node)
    g.add_node("worker", worker_node)
    g.add_node("reducer", reducer_subgraph)

    g.add_edge(START, "router")
    g.add_conditional_edges(
        "router",
        route_next,
        {"research": "research", "orchestrator": "orchestrator"},
    )
    g.add_edge("research", "orchestrator")
    g.add_conditional_edges("orchestrator", fanout, ["worker"])
    g.add_edge("worker", "reducer")
    g.add_edge("reducer", END)

    return g.compile()


# Module-level compiled graph – import this elsewhere
graph = build_graph()
