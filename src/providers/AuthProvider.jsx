import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      if (api.isAuthenticated()) {
        try {
          const userData = await api.getMe();
          if (userData) {
            setUser(userData);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await api.login(email, password);
      if (result.success) {
        setUser(result.user);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await api.register(email, password);
      if (result.success) {
        setUser(result.user);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
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
