# Blog Writing Agent

An AI-powered, full-stack application that generates long-form, research-backed blog posts on any topic. Register an account, enter a subject, and the system plans, researches, writes, assembles, and optionally illustrates a complete article — all autonomously. Generated blogs are saved to your account and accessible anytime.

Built with **LangGraph**, **LangChain**, **OpenAI GPT-4o**, **Tavily web search**, **FastAPI**, **PostgreSQL**, **MinIO**, and a **React + Vite** frontend.

---

## Demo

[Watch the application in action](https://drive.google.com/file/d/1zFE3-aBjkoQeSKaY3MuFfWLfJoa00_mh/view?usp=sharing)

---

## Features

- **Live pipeline visualization** — animated 9-node diagram tracks every stage of generation in real time via Server-Sent Events
- **Intelligent routing** — decides whether a topic needs live web research or can be answered from the model's training knowledge
- **Parallel section writing** — each blog section is drafted concurrently by independent worker nodes via LangGraph's Send API
- **Web-grounded evidence** — Tavily search retrieves up-to-date sources; citations are woven into the prose
- **AI-generated diagrams** — Google Gemini Imagen produces custom illustrations from structured image specs in the plan
- **Markdown output** — finished posts are delivered as clean, GitHub-flavoured Markdown with syntax-highlighted code blocks
- **User authentication** — register, log in, and maintain sessions via JWT access tokens + rotating refresh tokens stored in httpOnly cookies
- **Saved blogs** — authenticated users can save generated blogs to PostgreSQL and browse/delete them from a personal library
- **Object storage** — AI-generated images are stored in MinIO (S3-compatible); falls back to local filesystem when MinIO is not configured
- **Docker-first** — single `docker compose up -d` starts PostgreSQL and MinIO; Dockerfiles provided for backend and frontend

---

## Architecture

![System Architecture](docs/architecture.png)

Three-layer design: the React SPA communicates with the FastAPI backend over SSE (blog generation) and REST+cookies (auth/saved blogs); the backend persists data to PostgreSQL and images to MinIO via a swappable `StorageBackend` abstraction.

### LangGraph pipeline stages

| # | Node | What it does |
|---|---|---|
| 1 | `router` | Classifies the topic; picks mode: `closed_book`, `hybrid`, or `open_book` |
| 2 | `research` | Tavily web searches; collects cited evidence *(skipped in closed_book)* |
| 3 | `orchestrator` | Produces a structured plan: title, audience, tone, section outlines |
| 4 | `worker` ×N | Writes each section in parallel via LangGraph Send API |
| 5 | `merge_content` | Collects section drafts into a single document |
| 6 | `decide_images` | Generates structured image specs (alt text, caption, prompt) |
| 7 | `generate_and_place_images` | Calls Gemini Imagen, uploads PNGs to MinIO, splices `![…](…)` tags |

---

## Project structure

```
blog-writing-agent/
├── .env                       # Local environment variables (not committed)
├── docker-compose.yml         # PostgreSQL 16 + MinIO services
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── app/
│       ├── main.py            # App factory, lifespan (DB init, storage init), router mounts
│       ├── core/
│       │   ├── config.py      # Pydantic Settings — all env vars with defaults
│       │   ├── dependencies.py# FastAPI dependencies: get_db, get_current_user
│       │   ├── security.py    # bcrypt hashing, JWT encode/decode, refresh token utils
│       │   └── llm.py         # Singleton ChatOpenAI instance
│       ├── db/
│       │   ├── base.py        # SQLAlchemy async engine + session factory
│       │   └── models.py      # User, SavedBlog, RefreshToken ORM models
│       ├── schemas/
│       │   ├── auth.py        # RegisterRequest, LoginRequest, UserResponse
│       │   ├── blogs.py       # SaveBlogRequest, SavedBlogSummary, SavedBlogResponse
│       │   ├── agent.py       # LangGraph state & internal Pydantic models
│       │   └── api.py         # Blog generation REST schemas
│       ├── api/v1/
│       │   ├── auth.py        # POST /register /login /refresh /logout, GET /me
│       │   ├── blogs.py       # POST / GET / DELETE saved blogs
│       │   └── blog.py        # POST /generate (SSE streaming)
│       ├── services/
│       │   ├── auth_service.py  # User CRUD, refresh token rotation
│       │   ├── blogs_service.py # SavedBlog CRUD with ownership checks
│       │   ├── storage.py       # StorageBackend ABC: MinIO + local filesystem
│       │   ├── research.py      # Tavily search wrapper
│       │   ├── image_gen.py     # Gemini Imagen client
│       │   └── blog_service.py  # SSE streaming orchestrator
│       └── graph/
│           ├── prompts.py     # All system-prompt strings
│           ├── nodes.py       # Every LangGraph node function
│           └── builder.py     # Graph compilation → compiled `graph` instance
│
└── frontend/
    ├── Dockerfile             # Multi-stage: node builder → nginx server
    ├── nginx.conf             # SPA routing, /api proxy, SSE-compatible buffering
    ├── package.json
    ├── vite.config.ts         # Dev server + /api proxy to backend
    ├── tailwind.config.js
    └── src/
        ├── main.tsx           # AuthProvider + RouterProvider entry point
        ├── router.tsx         # createBrowserRouter: public + ProtectedRoute tree
        ├── api/
        │   ├── blogApi.ts         # SSE streaming client
        │   ├── authApi.ts         # register, login, logout, refresh, me
        │   └── savedBlogsApi.ts   # save, list, get, delete
        ├── context/
        │   └── AuthContext.tsx    # Session restore on refresh, login/logout actions
        ├── hooks/
        │   └── useBlogGeneration.ts  # Generation state machine + topic tracking
        ├── components/
        │   ├── Header.tsx         # Auth-aware nav: My Blogs, user info, logout
        │   ├── BlogForm.tsx        # Topic input (standard + compact sidebar mode)
        │   ├── BlogSkeleton.tsx    # Animated pipeline diagram + shimmer preview
        │   ├── BlogDisplay.tsx     # Markdown renderer + Save/Copy/Download actions
        │   ├── ProtectedRoute.tsx  # Outlet wrapper; redirects to /login if unauth
        │   └── StatusBadge.tsx
        ├── pages/
        │   ├── LandingPage.tsx        # Marketing page with hero, features, pipeline peek
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── GeneratorPage.tsx      # /app — main blog generation UI
        │   ├── SavedBlogsPage.tsx     # /app/saved — personal blog library
        │   └── SavedBlogDetailPage.tsx# /app/saved/:blogId — full blog view
        └── types/
            └── index.ts           # Shared TypeScript interfaces
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.13+ |
| Node.js | 20+ |
| Docker + Docker Compose | v2+ |
| OpenAI API key | — |
| Tavily API key | — |
| Google API key | optional (AI images) |

---

## Quick start

### Option A — Docker Compose + local dev servers (recommended)

**1. Clone and configure**

```bash
git clone <repo-url>
cd blog-writing-agent
cp .env.example .env
# Fill in OPENAI_API_KEY, TAVILY_API_KEY, and optionally GOOGLE_API_KEY
```

**2. Start infrastructure (PostgreSQL + MinIO)**

```bash
docker compose up -d
# Waits for health checks — both containers healthy in ~15 s
```

**3. Start the backend**

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The lifespan handler runs `create_all` to create DB tables and initialises the MinIO bucket on first start.

Backend API: `http://localhost:8000`
Interactive docs: `http://localhost:8000/api/docs`

**4. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`
MinIO console: `http://localhost:9001` (login: `minioadmin` / `minioadmin123`)

> The Vite dev server proxies `/api` to the backend — no CORS config needed locally.

---

### Option B — Full Docker (all services)

```bash
# Build and start everything
docker compose -f docker-compose.yml up --build

# Or run in background
docker compose up -d --build
```

> The full-Docker setup requires adding `backend` and `frontend` services to `docker-compose.yml` with their respective Dockerfiles. The provided Dockerfiles are production-ready for this purpose.

---

## Environment variables

Place these in a `.env` file at the **repo root**. All variables have sensible defaults except the API keys.

### AI / LLM

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key (GPT-4o) |
| `OPENAI_MODEL_NAME` | ❌ | `gpt-4o` | Override the OpenAI model |
| `TAVILY_API_KEY` | ✅ | — | Tavily API key for web research |
| `GOOGLE_API_KEY` | ❌ | — | Google AI Studio key for Gemini image generation |

### Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEBUG` | ❌ | `false` | FastAPI debug mode |
| `CORS_ORIGINS` | ❌ | `["http://localhost:5173"]` | Allowed CORS origins (JSON array) |
| `IMAGES_DIR` | ❌ | `backend/images/` | Local path for images when MinIO is not configured |

### Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ❌ | `postgresql+asyncpg://postgres:postgres_password@localhost:5432/blog_agent` | Async PostgreSQL connection URL |

### Authentication

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET_KEY` | ✅ (prod) | `CHANGE_ME_IN_PRODUCTION…` | HS256 signing secret — generate with `openssl rand -hex 32` |
| `JWT_ALGORITHM` | ❌ | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ❌ | `7` | Refresh token lifetime |

### Object storage (MinIO / S3)

Leave `MINIO_ENDPOINT` unset to fall back to local filesystem storage.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MINIO_ENDPOINT` | ❌ | — | MinIO host:port, e.g. `localhost:9000` |
| `MINIO_ACCESS_KEY` | ❌ | `minioadmin` | MinIO root user |
| `MINIO_SECRET_KEY` | ❌ | `minioadmin123` | MinIO root password |
| `MINIO_BUCKET` | ❌ | `blog-images` | Bucket name (auto-created on startup) |
| `MINIO_SECURE` | ❌ | `false` | Use HTTPS for MinIO connection |
| `MINIO_PUBLIC_URL` | ❌ | — | Public base URL for serving images, e.g. `http://localhost:9000` |

---

## API reference

### Authentication — `/api/v1/auth`

All auth endpoints set `access_token` and `refresh_token` httpOnly cookies on success.

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Create account. Returns `UserResponse` (201) |
| `POST` | `/login` | Authenticate. Returns `UserResponse` (200) |
| `POST` | `/refresh` | Rotate refresh token; issues new cookie pair |
| `POST` | `/logout` | Revokes all refresh tokens; clears cookies (204) |
| `GET` | `/me` | Returns current `UserResponse` or 401 |

### Saved blogs — `/api/v1/blogs`

Requires a valid `access_token` cookie.

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Save a generated blog (201) |
| `GET` | `/?limit=20&offset=0` | List your saved blogs (summary, no content) |
| `GET` | `/{id}` | Get a single blog with full content |
| `DELETE` | `/{id}` | Delete a blog (204) |

### Blog generation — `/api/v1/blog`

Public endpoint — no authentication required.

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate` | Start generation; returns SSE stream |

**SSE event types**

```
data: {"type": "progress", "step": "router",       "message": "🔍 Analysing topic…"}
data: {"type": "progress", "step": "research",     "message": "🌐 Researching the web…"}
data: {"type": "progress", "step": "orchestrator", "message": "📝 Planning blog structure…"}
data: {"type": "progress", "step": "worker",       "message": "✍️  Writing sections…"}
data: {"type": "progress", "step": "reducer",      "message": "🔧 Assembling final blog…"}
data: {"type": "complete", "title": "…", "content": "# …\n\n…", "section_count": 7, …}
data: {"type": "error",    "message": "…"}
```

**Quick test**

```bash
curl -N -X POST http://localhost:8000/api/v1/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Self-Attention in Transformer Architectures"}'
```

---

## Tech stack

### Backend

| Library | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | REST API framework with SSE and lifespan support |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Stateful multi-agent pipeline with Send API fan-out |
| [LangChain](https://python.langchain.com) | LLM abstractions and tool wrappers |
| [langchain-openai](https://python.langchain.com/docs/integrations/llms/openai) | OpenAI GPT-4o integration |
| [langchain-tavily](https://python.langchain.com/docs/integrations/tools/tavily_search) | Tavily web search tool |
| [google-genai](https://ai.google.dev/gemini-api/docs) | Gemini Imagen for AI image generation |
| [SQLAlchemy 2.0](https://docs.sqlalchemy.org) | Async ORM with `asyncpg` driver |
| [python-jose](https://python-jose.readthedocs.io) | JWT encoding and decoding |
| [bcrypt](https://pypi.org/project/bcrypt/) | Password hashing |
| [boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) | MinIO / S3 client for image storage |
| [Pydantic v2](https://docs.pydantic.dev) | Data validation and settings management |
| [uvicorn](https://www.uvicorn.org) | ASGI server |

### Frontend

| Library | Purpose |
|---|---|
| [Vite 6](https://vite.dev) | Build tool and dev server |
| [React 19](https://react.dev) | UI framework |
| [React Router v6](https://reactrouter.com) | SPA routing with `createBrowserRouter` |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS 3](https://tailwindcss.com) | Utility-first styling |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Markdown blog rendering |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | GitHub Flavoured Markdown |
| [rehype-highlight](https://github.com/rehypejs/rehype-highlight) | Code block syntax highlighting |
| [lucide-react](https://lucide.dev) | Icon library |

### Infrastructure

| Service | Purpose |
|---|---|
| PostgreSQL 16 | Persistent store for users, blogs, refresh tokens |
| MinIO | S3-compatible object storage for AI-generated images |
| Docker Compose | One-command local infrastructure setup |
| Nginx | Frontend static file server + `/api` reverse proxy |

---

## Security design

- **Passwords** — hashed with bcrypt (cost factor 12); plain text never stored or logged
- **Access tokens** — short-lived JWT (30 min default), signed HS256, delivered as `httpOnly` cookie
- **Refresh tokens** — long-lived (7 days), stored as SHA-256 hash in DB (raw token never persisted), rotated on every use
- **Logout** — revokes all active refresh tokens for the user
- **Cookie flags** — `httpOnly`, `SameSite=Lax`; set `MINIO_SECURE=true` + `secure=True` in production behind HTTPS
- **Production checklist** — set a strong `JWT_SECRET_KEY` (`openssl rand -hex 32`), restrict `CORS_ORIGINS`, enable HTTPS

---

## Development

### Backend

```bash
cd backend
ruff check .      # lint
ruff format .     # format
mypy app/         # type check
```

### Frontend

```bash
cd frontend
npm run build     # TypeScript compile + Vite production build
npm run preview   # Preview production build locally
```

### Resetting the database

```bash
docker compose down -v   # removes postgres_data and minio_data volumes
docker compose up -d     # fresh start — tables re-created on backend startup
```
