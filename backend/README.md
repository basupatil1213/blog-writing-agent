# Blog Writing Agent — Backend

FastAPI backend for the AI-powered blog writing agent.  
Built with **LangGraph**, **LangChain**, **OpenAI GPT-4o**, and optionally **Google Gemini** for image generation.

---

## Project structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app factory
│   ├── api/
│   │   └── v1/
│   │       └── blog.py      # POST /api/v1/blog/generate (SSE stream)
│   ├── core/
│   │   ├── config.py        # Settings via pydantic-settings
│   │   └── llm.py           # Singleton ChatOpenAI instance
│   ├── schemas/
│   │   ├── agent.py         # LangGraph internal Pydantic models
│   │   └── api.py           # Request / response schemas
│   ├── graph/
│   │   ├── prompts.py       # All system-prompt strings
│   │   ├── nodes.py         # Every LangGraph node function
│   │   └── builder.py       # Graph compilation → `graph` instance
│   └── services/
│       ├── research.py      # Tavily search wrapper
│       ├── image_gen.py     # Gemini image generation
│       └── blog_service.py  # High-level SSE streaming generator
└── images/                  # Generated images (served as static files)
```

---

## Quick start

### 1. Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) (or pip)
- API keys: OpenAI, Tavily, (optionally) Google Gemini

### 2. Configure environment

```bash
# From the repo root
cp .env.example .env
# Edit .env and fill in your API keys
```

### 3. Install dependencies

```bash
cd backend
uv pip install -e ".[dev]"
# or: pip install -e ".[dev]"
```

### 4. Run the development server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at <http://localhost:8000>.  
Interactive docs: <http://localhost:8000/api/docs>

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/blog/generate` | Generate a blog (SSE stream) |
| `GET`  | `/api/health` | Health check |
| `GET`  | `/images/{filename}` | Serve generated images |

### Generate a blog — SSE stream

```bash
curl -N -X POST http://localhost:8000/api/v1/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Self-Attention in Transformer Architectures"}'
```

Events emitted:
```
data: {"type": "progress", "step": "queued",       "message": "🚀 Blog generation started…"}
data: {"type": "progress", "step": "router",       "message": "🔍 Analysing topic…"}
data: {"type": "progress", "step": "orchestrator", "message": "📝 Planning blog structure…"}
data: {"type": "progress", "step": "worker",       "message": "✍️  Writing blog sections…"}
data: {"type": "progress", "step": "reducer",      "message": "🔧 Assembling final blog…"}
data: {"type": "complete", "title": "…", "content": "# …\n\n…", "section_count": 7, …}
```

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `OPENAI_MODEL_NAME` | ❌ | `gpt-4o` | Model name |
| `TAVILY_API_KEY` | ✅ | — | Tavily search key |
| `GOOGLE_API_KEY` | ❌ | — | Gemini key (images) |
| `IMAGES_DIR` | ❌ | `backend/images/` | Image storage path |
| `DEBUG` | ❌ | `false` | Enable debug mode |
| `CORS_ORIGINS` | ❌ | `["http://localhost:5173"]` | Allowed CORS origins |
