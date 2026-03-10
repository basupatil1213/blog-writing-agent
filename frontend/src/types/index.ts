// ── SSE event types emitted by the backend ────────────────────────────────────

export interface ProgressEvent {
  type: 'progress';
  step: string;
  message: string;
}

export interface CompleteEvent {
  type: 'complete';
  title: string;
  blog_kind: BlogKind;
  mode: ResearchMode;
  needs_research: boolean;
  evidence_count: number;
  section_count: number;
  content: string;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type BlogStreamEvent = ProgressEvent | CompleteEvent | ErrorEvent;

// ── Domain types ──────────────────────────────────────────────────────────────

export type BlogKind =
  | 'explainer'
  | 'tutorial'
  | 'news_roundup'
  | 'comparison'
  | 'system_design';

export type ResearchMode = 'closed_book' | 'hybrid' | 'open_book';

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface ProgressStep {
  step: string;
  message: string;
  completedAt: number; // Date.now()
}

export interface BlogResult {
  title: string;
  blog_kind: BlogKind;
  mode: ResearchMode;
  needs_research: boolean;
  evidence_count: number;
  section_count: number;
  content: string;
}

// ── API request types ─────────────────────────────────────────────────────────

export interface BlogGenerateRequest {
  topic: string;
  as_of?: string;
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Saved blog types ──────────────────────────────────────────────────────────

export interface SaveBlogRequest {
  title: string;
  topic: string;
  blog_kind: string;
  mode: string;
  needs_research: boolean;
  evidence_count: number;
  section_count: number;
  content: string;
  image_urls: string[];
  generation_time_ms?: number;
}

export interface SavedBlogSummary {
  id: string;
  title: string;
  topic: string;
  blog_kind: BlogKind;
  mode: ResearchMode;
  needs_research: boolean;
  evidence_count: number;
  section_count: number;
  generation_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavedBlogDetail extends SavedBlogSummary {
  content: string;
  image_urls: string[];
}
