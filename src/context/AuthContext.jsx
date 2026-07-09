import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      applyUserSettings(data.settings);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyUserSettings = (settings) => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.theme) {
      if (settings.theme === 'light') root.classList.add('light-theme');
      else root.classList.remove('light-theme');
    }
    if (settings.colorTheme) {
      root.setAttribute('data-theme', settings.colorTheme);
    }
    if (settings.primaryColor) {
      root.style.setProperty('--clr-primary-500', settings.primaryColor);
    } else {
      root.style.removeProperty('--clr-primary-500');
    }
    if (settings.fontSize) root.style.setProperty('--text-size', settings.fontSize);
  };


  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
    if (newData.settings) {
      applyUserSettings(newData.settings);
    }
  };

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    applyUserSettings(data.user?.settings);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    applyUserSettings(data.user?.settings);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    document.documentElement.classList.remove('light-theme');
    document.documentElement.style.removeProperty('--clr-primary-500');
    document.documentElement.style.removeProperty('--text-size');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER' || isAdmin;
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin, isTeacher, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
