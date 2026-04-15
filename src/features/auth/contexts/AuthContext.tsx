import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { withCsrf } from '@/shared/lib/csrf';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  address?: string;
  phone?: string;
  companyName?: string;
}

interface AuthResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  updateProfile: (data: { name?: string; avatar?: string; address?: string; phone?: string; companyName?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        await fetch(`${API_URL}/auth/csrf`, { credentials: 'include' });
        const me = await fetchJson<User>('/auth/me', { method: 'GET' });
        setUser(me);
      } catch {
        const refreshed = await tryRefresh();
        if (refreshed?.user) {
          setUser(refreshed.user);
        } else {
          const err = refreshed?.error;
          if (err && isNetworkError(err)) {
            toast({
              title: 'Tidak dapat terhubung',
              description: 'Server sedang tidak tersedia. Coba lagi nanti.',
              variant: 'destructive',
            });
          }
          clearAuth();
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await fetchJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(response.user);
    return true;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const response = await fetchJson<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setUser(response.user);
    return true;
  };

  const logout = () => {
    fetchJson('/auth/logout', { method: 'POST' }).catch(() => undefined);
    clearAuth();
  };

  const updateProfile = async (data: { name?: string; avatar?: string; address?: string; phone?: string; companyName?: string }): Promise<boolean> => {
    const updatedUser = await fetchJson<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setUser(updatedUser);
    return true;
  };

  const clearAuth = () => {
    setUser(null);
  };

  const tryRefresh = async (): Promise<{ user: User } | { error: Error } | null> => {
    try {
        await fetchJson<{ success: true }>('/auth/refresh', {
          method: 'POST',
        });
        const me = await fetchJson<User>('/auth/me', {
          method: 'GET',
        });
        return { user: me };
      } catch (err) {
        if (err instanceof Error) {
          if ((err as Error & { status?: number }).status === 401) {
            clearAuth();
            // Don't hard-reload the whole app on auth failure.
            // ProtectedRoute will redirect to /login as needed.
          }
          return { error: err };
        }
        return { error: new Error('Request failed') };
      }
    };

  const isNetworkError = (err: Error) => {
    return /failed to fetch|networkerror|net::err/i.test(err.message);
  };

  const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };
    const response = await fetch(`${API_URL}${path}`, {
      ...withCsrf({
        ...options,
        headers,
      }),
      credentials: 'include',
    });
    if (!response.ok) {
      let message = 'Request failed';
      try {
        const body = await response.json();
        message = body.message ?? message;
      } catch {
        // ignore parsing errors
      }
      const error = new Error(message) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return response.json() as Promise<T>;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
