import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated by calling /auth/me
    api.get('/auth/me')
    .then(res => {
      console.log('=== INITIAL USER LOAD ===');
      console.log('Loaded user:', res.data);
      console.log('Initial avatar_url:', res.data?.avatar_url);
      setUser(res.data);
    })
    .catch(() => setUser(null))
    .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await api.post(`/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    // After successful login, fetch user data
    const userRes = await api.get('/auth/me');
    setUser(userRes.data);
    return res.data;
  };

  const register = async (username, email, password, full_name) => {
    const res = await api.post('/auth/register', {
      username, email, password, full_name
    });
    return res.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      console.log('=== REFRESHING USER DATA ===');
      const res = await api.get('/auth/me');
      console.log('Refreshed user data:', res.data);
      console.log('Avatar URL after refresh:', res.data?.avatar_url);
      setUser(res.data);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
