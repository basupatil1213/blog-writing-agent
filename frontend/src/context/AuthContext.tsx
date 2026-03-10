import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/authApi';
import type { LoginRequest, RegisterRequest, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — try to restore session from httpOnly cookie
  useEffect(() => {
    (async () => {
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        // access_token expired — try to rotate via refresh_token cookie
        try {
          const me = await authApi.refresh();
          setUser(me);
        } catch {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const me = await authApi.login(data);
    setUser(me);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const me = await authApi.register(data);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
