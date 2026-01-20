import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
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

const AUTH_KEY = 'auth_user';
const USERS_KEY = 'registered_users';

// Hardcoded test credentials
const TEST_EMAIL = 'admin@test.com';
const TEST_PASSWORD = 'password123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check hardcoded test credentials first
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      const testUser: User = {
        id: 'test-admin-001',
        email: TEST_EMAIL,
        name: 'Admin Test',
      };
      setUser(testUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(testUser));
      return true;
    }
    
    // Fallback to registered users
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Record<string, { password: string; name: string }> = usersRaw ? JSON.parse(usersRaw) : {};
    
    const userRecord = users[email];
    if (userRecord && userRecord.password === password) {
      const loggedInUser: User = {
        id: email,
        email,
        name: userRecord.name,
      };
      setUser(loggedInUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: Record<string, { password: string; name: string }> = usersRaw ? JSON.parse(usersRaw) : {};
    
    if (users[email]) {
      return false; // User already exists
    }
    
    users[email] = { password, name };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const newUser: User = { id: email, email, name };
    setUser(newUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const updateProfile = async (data: { name?: string; avatar?: string }): Promise<boolean> => {
    if (!user) return false;
    
    const updatedUser: User = {
      ...user,
      name: data.name || user.name,
      avatar: data.avatar || user.avatar,
    };
    
    setUser(updatedUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    
    // Also update in registered users if exists
    const usersRaw = localStorage.getItem(USERS_KEY);
    if (usersRaw) {
      const users: Record<string, { password: string; name: string }> = JSON.parse(usersRaw);
      if (users[user.email]) {
        users[user.email].name = data.name || user.name;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
    
    return true;
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
