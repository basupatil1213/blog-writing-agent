# Blog Writing Agent — Frontend

Vite + React + TypeScript frontend for the AI-powered blog writing agent.

---

## Tech stack

| Technology | Purpose |
|------------|---------|
| **Vite 6** | Build tool & dev server |
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS 3** | Utility-first styling |
| **@tailwindcss/typography** | Beautiful markdown typography |
| **react-markdown** | Render blog Markdown |
| **remark-gfm** | GitHub Flavoured Markdown support |
| **rehype-highlight** | Syntax highlighting for code blocks |
| **lucide-react** | Icon library |

---

## Project structure

```
frontend/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root layout + routing logic
│   ├── index.css                # Tailwind directives + custom styles
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── api/
│   │   └── blogApi.ts           # SSE streaming API client
│   ├── hooks/
│   │   └── useBlogGeneration.ts # Blog generation state machine
│   └── components/
│       ├── Header.tsx           # Sticky navigation header
│       ├── BlogForm.tsx         # Topic input form + examples
│       ├── BlogDisplay.tsx      # Rendered Markdown blog with metadata
│       ├── ProgressIndicator.tsx# Live SSE progress timeline
│       └── StatusBadge.tsx      # Coloured metadata badges
├── index.html
├── vite.config.ts               # Vite config + /api proxy
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Quick start

### Prerequisites

- Node.js 20+ (or Bun)
- Backend running on `http://localhost:8000`

### Install & run

```bash
cd frontend
npm install        # or: bun install / pnpm install
npm run dev        # starts on http://localhost:5173
```

The `/api` and `/images` paths are automatically proxied to the backend at `http://localhost:8000`.

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

---

## Environment

No `.env` file is needed for the frontend — all backend calls go through Vite's proxy.  
To change the backend URL, edit `vite.config.ts → server.proxy`.
