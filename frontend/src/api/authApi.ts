import type { LoginRequest, RegisterRequest, User } from '@/types';

const BASE = '/api/v1/auth';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // send/receive httpOnly cookies
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    request<User>('/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginRequest) =>
    request<User>('/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<void>('/logout', { method: 'POST' }),

  refresh: () =>
    request<User>('/refresh', { method: 'POST' }),

  me: () =>
    request<User>('/me', { method: 'GET' }),
};
