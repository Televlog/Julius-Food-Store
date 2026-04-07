import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: { url: string };
  isEmailVerified: boolean;
  sellerInfo?: { storeName: string; isApproved: boolean };
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  register: (data: Record<string, string>) => Promise<any>;
  updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const res = await authAPI.getMe() as any;
      setUser(res.user);
    } catch {
      await SecureStore.deleteItemAsync('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password) as any;
    await SecureStore.setItemAsync('token', res.token);
    setUser(res.user);
    return res;
  };

  const register = async (data: Record<string, string>) => {
    const res = await authAPI.register(data) as any;
    await SecureStore.setItemAsync('token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = React.use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
