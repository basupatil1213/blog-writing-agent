import type { SaveBlogRequest, SavedBlogDetail, SavedBlogSummary } from '@/types';

const BASE = '/api/v1/blogs';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const savedBlogsApi = {
  save: (data: SaveBlogRequest) =>
    request<SavedBlogDetail>('/', { method: 'POST', body: JSON.stringify(data) }),

  list: (limit = 20, offset = 0) =>
    request<SavedBlogSummary[]>(`/?limit=${limit}&offset=${offset}`, { method: 'GET' }),

  get: (id: string) =>
    request<SavedBlogDetail>(`/${id}`, { method: 'GET' }),

  delete: (id: string) =>
    request<void>(`/${id}`, { method: 'DELETE' }),
};
