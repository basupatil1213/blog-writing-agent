# Blog Writing Agent

An AI-powered, full-stack application that generates long-form, research-backed blog posts on any topic. Give it a subject and it plans, researches, writes, assembles, and optionally illustrates a complete article — all autonomously.

Built with **LangGraph**, **LangChain**, **OpenAI GPT-4o**, **Tavily web search**, and a **React + Vite** frontend.

---

## Features

- **Intelligent routing** — decides whether a topic needs live web research or can be answered from the model's training knowledge
- **Parallel section writing** — each blog section is drafted concurrently by independent worker nodes via LangGraph's Send API
- **Web-grounded evidence** — Tavily search retrieves up-to-date sources; citations are woven into the prose
- **AI-generated diagrams** — Google Gemini Imagen produces custom illustrations from structured image specs embedded in the plan
- **Server-Sent Events (SSE) streaming** — the frontend receives real-time progress updates as the pipeline advances through each stage
- **Markdown output** — the finished post is delivered as clean, GitHub-flavoured Markdown with syntax-highlighted code blocks

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Frontend (React)                  │
│  BlogForm → useBlogGeneration hook → SSE stream       │
│  ProgressIndicator → BlogDisplay (react-markdown)     │
└──────────────────────┬───────────────────────────────┘
                       │ POST /api/v1/blog/generate (SSE)
┌──────────────────────▼───────────────────────────────┐
│                  FastAPI Backend                       │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │               LangGraph Pipeline                │  │
│  │                                                 │  │
│  │  START                                          │  │
│  │    │                                            │  │
│  │    ▼                                            │  │
│  │  router ──── needs research? ─── yes ──▶ research│ │
│  │    │                                      │     │  │
│  │    └──────── no ───────────────────────────┘    │  │
│  │                          │                      │  │
│  │                          ▼                      │  │
│  │                    orchestrator                  │  │
│  │                  (plan sections)                 │  │
│  │                          │                      │  │
│  │              ┌───────────┴──────────┐           │  │
│  │              │  fan-out (Send API)  │           │  │
│  │              ▼          ▼          ▼           │  │
│  │           worker     worker     worker  …       │  │
│  │              │          │          │            │  │
│  │              └──────────┴──────────┘            │  │
│  │                          │                      │  │
│  │                          ▼                      │  │
│  │                   reducer subgraph               │  │
│  │              merge → decide_images               │  │
│  │                    → generate_and_place_images   │  │
│  │                          │                      │  │
│  │                         END                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  Static file server  →  backend/images/               │
└──────────────────────────────────────────────────────┘
```

### Pipeline stages

| Stage | Node | What it does |
|---|---|---|
| 1 | `router` | Classifies the topic and picks a research mode (`closed_book`, `hybrid`, or `open_book`) |
| 2 | `research` | Runs Tavily web searches and collects cited evidence *(skipped in closed_book mode)* |
| 3 | `orchestrator` | Produces a structured blog plan (title, audience, tone, section outlines) |
| 4 | `worker` ×N | Writes each section in parallel, injecting evidence where relevant |
| 5 | `merge_content` | Collects all section drafts into a single document |
| 6 | `decide_images` | Generates structured image specs (alt text, caption, prompt) for key visuals |
| 7 | `generate_and_place_images` | Calls Gemini Imagen, saves PNGs, and splices `![…](…)` tags into the Markdown |

---

## Project structure

```
blog-writing-agent/
├── .env.example              # Environment variable template
├── .gitignore
├── .python-version           # Pinned Python version (3.13)
│
├── backend/                  # FastAPI + LangGraph backend
│   ├── pyproject.toml
│   └── app/
│       ├── main.py           # App factory, CORS, static files, router mount
│       ├── core/
│       │   ├── config.py     # Pydantic Settings — all env vars
│       │   └── llm.py        # Singleton ChatOpenAI instance
│       ├── schemas/
│       │   ├── agent.py      # LangGraph state & internal Pydantic models
│       │   └── api.py        # REST request / response schemas
│       ├── graph/
│       │   ├── prompts.py    # All system-prompt strings
│       │   ├── nodes.py      # Every LangGraph node function
│       │   └── builder.py    # Graph compilation → `graph` module-level instance
│       ├── services/
│       │   ├── research.py   # Tavily search wrapper
│       │   ├── image_gen.py  # Gemini Imagen client
│       │   └── blog_service.py # SSE streaming orchestrator
│       └── images/           # Generated images (served as static files)
│
└── frontend/                 # Vite + React + TypeScript frontend
    ├── package.json
    ├── vite.config.ts        # Dev server + /api proxy to backend
    ├── tailwind.config.js
    └── src/
        ├── App.tsx           # Root layout
        ├── api/
        │   └── blogApi.ts    # SSE streaming API client
        ├── hooks/
        │   └── useBlogGeneration.ts  # Generation state machine
        ├── components/
        │   ├── Header.tsx
        │   ├── BlogForm.tsx
        │   ├── ProgressIndicator.tsx
        │   ├── BlogDisplay.tsx
        │   └── StatusBadge.tsx
        └── types/
            └── index.ts      # Shared TypeScript interfaces
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.13+ |
| Node.js | 20+ |
| [uv](https://docs.astral.sh/uv/) | latest *(or pip)* |
| OpenAI API key | — |
| Tavily API key | — |
| Google API key | optional (images) |

---

## Quick start

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd blog-writing-agent

cp .env.example .env
# Open .env and fill in your API keys
```

### 2. Start the backend

```bash
cd backend
uv pip install -e .          # or: pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend available at: `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/api/docs`

### 3. Start the frontend

```bash
# In a separate terminal
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:5173`

> The frontend's Vite dev server automatically proxies `/api` and `/images` requests to the backend — no extra configuration needed.

---

## Environment variables

Copy `.env.example` to `.env` in the **repo root** and populate the values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key for GPT-4o |
| `OPENAI_MODEL_NAME` | ❌ | `gpt-4o` | Override the OpenAI model |
| `TAVILY_API_KEY` | ✅ | — | Tavily API key for web research |
| `GOOGLE_API_KEY` | ❌ | — | Google AI Studio key for Gemini image generation |
| `DEBUG` | ❌ | `false` | Enable FastAPI debug mode |
| `CORS_ORIGINS` | ❌ | `["http://localhost:5173"]` | Allowed CORS origins (JSON array) |
| `IMAGES_DIR` | ❌ | `backend/images/` | Absolute path for generated image storage |

---

## API reference

### `POST /api/v1/blog/generate`

Start a blog generation job. Returns a **Server-Sent Events** stream.

**Request body**

```json
{
  "topic": "Self-Attention in Transformer Architectures"
}
```

**SSE events**

```
data: {"type": "progress", "step": "queued",       "message": "🚀 Blog generation started…"}
data: {"type": "progress", "step": "router",       "message": "🔍 Analysing topic…"}
data: {"type": "progress", "step": "research",     "message": "🌐 Researching the web…"}
data: {"type": "progress", "step": "orchestrator", "message": "📝 Planning blog structure…"}
data: {"type": "progress", "step": "worker",       "message": "✍️  Writing blog sections…"}
data: {"type": "progress", "step": "reducer",      "message": "🔧 Assembling final blog…"}
data: {"type": "complete", "title": "…", "content": "# …\n\n…", "section_count": 7}
```

**Quick test with curl**

```bash
curl -N -X POST http://localhost:8000/api/v1/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Self-Attention in Transformer Architectures"}'
```

### `GET /api/health`

Returns `{"status": "ok"}` once the server is ready.

---

## Tech stack

### Backend

| Library | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | REST API framework with SSE support |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Stateful multi-agent pipeline |
| [LangChain](https://python.langchain.com) | LLM abstractions and tool wrappers |
| [langchain-openai](https://python.langchain.com/docs/integrations/llms/openai) | OpenAI ChatGPT integration |
| [langchain-tavily](https://python.langchain.com/docs/integrations/tools/tavily_search) | Tavily web search tool |
| [google-genai](https://ai.google.dev/gemini-api/docs) | Gemini Imagen for AI image generation |
| [Pydantic v2](https://docs.pydantic.dev) | Data validation and settings management |
| [uvicorn](https://www.uvicorn.org) | ASGI server |

### Frontend

| Library | Purpose |
|---|---|
| [Vite 6](https://vite.dev) | Build tool and dev server |
| [React 18](https://react.dev) | UI framework |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS 3](https://tailwindcss.com) | Utility-first styling |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Render Markdown blog posts |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | GitHub Flavoured Markdown |
| [rehype-highlight](https://github.com/rehypejs/rehype-highlight) | Code block syntax highlighting |
| [lucide-react](https://lucide.dev) | Icon library |

---

## Development

### Backend — linting and type checking

```bash
cd backend
ruff check .          # lint
ruff format .         # format
mypy app/             # type check
```

### Frontend — type checking and build

```bash
cd frontend
npm run build         # TypeScript compile + Vite production build
npm run preview       # Preview production build locally
```
