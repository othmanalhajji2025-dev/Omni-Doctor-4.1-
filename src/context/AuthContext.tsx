import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; messageAr?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    fullNameEn?: string;
    role?: UserRole;
    specialty?: string;
    licenseNumber?: string;
    age?: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }) => Promise<{ success: boolean; error?: string; messageAr?: string }>;
  signOut: () => Promise<void>;
  quickLogin: (roleOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'omnidoctor_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const role: UserRole = user?.role || 'GUEST';
  const isAuthenticated = Boolean(user && token);

  // Authenticated fetch wrapper
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      const currentToken = token || localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [token]
  );

  // Verify and fetch current user
  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(storedToken);
      } else {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching /api/auth/me:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Sign in failed',
          messageAr: data.messageAr || 'تعذر تسجيل الدخول، يرجى التأكد من البيانات',
        };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, messageAr: data.messageAr };
    } catch (err: any) {
      return { success: false, error: err.message, messageAr: 'حدث خطأ في الاتصال بالخادم' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up
  const signUp = async (signUpData: {
    email: string;
    password: string;
    fullName: string;
    fullNameEn?: string;
    role?: UserRole;
    specialty?: string;
    licenseNumber?: string;
    age?: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Registration failed',
          messageAr: data.messageAr || 'فشل في إنشاء الحساب الطبي',
        };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, messageAr: data.messageAr };
    } catch (err: any) {
      return { success: false, error: err.message, messageAr: 'حدث خطأ في الاتصال بالخادم' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.warn('Error signing out on server:', err);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // Quick Login (Convenient role switcher for evaluation)
  const quickLogin = async (roleOrEmail: string) => {
    setIsLoading(true);
    try {
      const body = roleOrEmail.includes('@')
        ? { email: roleOrEmail }
        : { role: roleOrEmail };

      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Quick login failed' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Check RBAC permissions
  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return allowedRoles.includes('GUEST');
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        quickLogin,
        hasRole,
        fetchWithAuth,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
