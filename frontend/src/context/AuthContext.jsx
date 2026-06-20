import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

// Role → default route
export const ROLE_HOME = {
  ADMIN:         '/dashboard',
  OWNER:         '/reports',
  SALES:         '/sales',
  PURCHASE:      '/purchase',
  MANUFACTURING: '/manufacturing',
  INVENTORY:     '/inventory',
};

// Role → allowed routes
export const ROLE_ROUTES = {
  ADMIN:         ['/dashboard', '/products', '/sales', '/purchase', '/manufacturing', '/inventory', '/reports', '/users', '/audit'],
  OWNER:         ['/dashboard', '/products', '/reports'],
  SALES:         ['/sales', '/reports'],
  PURCHASE:      ['/purchase', '/reports'],
  MANUFACTURING: ['/manufacturing', '/reports'],
  INVENTORY:     ['/inventory', '/reports'],
};

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [loading, setLoading]   = useState(true);

  // On mount — restore session
  useEffect(() => {
    const storedToken = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
    const storedUser  = localStorage.getItem('erp_user')  || sessionStorage.getItem('erp_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch { /* corrupt storage */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const { data } = await api.post('/auth/login', { email, password });
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('erp_token', data.token);
    storage.setItem('erp_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    sessionStorage.removeItem('erp_token');
    sessionStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  const canAccess = useCallback((path) => {
    if (!user) return false;
    const allowed = ROLE_ROUTES[user.role] || [];
    return allowed.some(r => path.startsWith(r));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
