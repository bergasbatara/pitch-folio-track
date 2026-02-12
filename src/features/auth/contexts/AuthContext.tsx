import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'auth_user';
const AUTH_ACCESS_TOKEN_KEY = 'auth_access_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      if (storedUser && accessToken) {
        try {
          if (isTokenExpired(accessToken) && refreshToken) {
            const refreshed = await tryRefresh(refreshToken);
            if (!refreshed) {
              clearAuth();
              setIsLoading(false);
              return;
            }
          }
          const me = await fetchJson<User>('/auth/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setUser(me);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
        } catch (error) {
          if (refreshToken) {
            const refreshed = await tryRefresh(refreshToken);
            if (refreshed) {
              setUser(refreshed.user);
            } else {
              clearAuth();
            }
          } else {
            clearAuth();
          }
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
    applyAuth(response);
    return true;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const response = await fetchJson<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    applyAuth(response);
    return true;
  };

  const logout = () => {
    clearAuth();
  };

  const updateProfile = async (data: { name?: string; avatar?: string }): Promise<boolean> => {
    const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    if (!accessToken) return false;
    const updatedUser = await fetchJson<User>('/auth/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    setUser(updatedUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    return true;
  };

  const clearAuth = () => {
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  };

  const applyAuth = (response: AuthResponse) => {
    setUser(response.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.refreshToken);
  };

  const tryRefresh = async (refreshToken: string) => {
    try {
      const tokens = await fetchJson<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
      const me = await fetchJson<User>('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
      return { user: me };
    } catch {
      return null;
    }
  };

  const fetchJson = async <T,>(path: string, options: RequestInit): Promise<T> => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      let message = 'Request failed';
      try {
        const body = await response.json();
        message = body.message ?? message;
      } catch {
        // ignore parsing errors
      }
      throw new Error(message);
    }
    return response.json() as Promise<T>;
  };

  const isTokenExpired = (token: string) => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (!decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
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
