import type { BlogGenerateRequest, BlogStreamEvent } from '@/types';

const API_BASE = '/api/v1';

/**
 * Stream blog generation events from the backend using fetch + ReadableStream.
 *
 * EventSource does not support POST, so we manually parse the SSE text stream
 * from a fetch response body.
 */
export async function* streamBlogGeneration(
  request: BlogGenerateRequest,
  signal?: AbortSignal,
): AsyncGenerator<BlogStreamEvent> {
  const response = await fetch(`${API_BASE}/blog/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Server error ${response.status}: ${text || response.statusText}`,
    );
  }

  if (!response.body) {
    throw new Error('Response body is null — streaming not supported.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        for (const line of part.split('\n')) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw) {
              try {
                yield JSON.parse(raw) as BlogStreamEvent;
              } catch {
                console.warn('Failed to parse SSE event:', raw);
              }
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
