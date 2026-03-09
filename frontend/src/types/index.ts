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
