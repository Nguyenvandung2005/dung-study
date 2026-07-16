import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    // Check inactivity before fetching me
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT) {
      logout();
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      applyUserSettings(data.settings);
      localStorage.setItem('lastActivity', Date.now().toString());
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
    localStorage.setItem('lastActivity', Date.now().toString());
    setUser(data.user);
    applyUserSettings(data.user?.settings);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('lastActivity', Date.now().toString());
    setUser(data.user);
    applyUserSettings(data.user?.settings);
    return data.user;
  };

  const oauthLogin = async (provider, credentials, role = null, grade = null) => {
    const { data } = await api.post(`/auth/${provider}`, { ...credentials, role, grade });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('lastActivity', Date.now().toString());
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

  // Activity tracking for auto logout
  useEffect(() => {
    if (!user) return;

    let intervalId;

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT) {
        logout();
        window.location.href = '/login'; // Force redirect
      }
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    // Check every minute
    intervalId = setInterval(checkInactivity, 60000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(intervalId);
    };
  }, [user]);

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER' || isAdmin;
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider value={{ user, loading, login, oauthLogin, register, logout, updateUser, isAdmin, isTeacher, isStudent }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
