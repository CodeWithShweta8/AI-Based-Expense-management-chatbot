import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Add token to requests
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Authentication check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.error ||
        (error.message.includes('Network Error') || error.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Ensure backend is running.'
          : 'Login failed');

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (userData) => {
    try {
      const response = await apiClient.put('/users/me', userData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed',
      };
    }
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    logout,
    updateProfile,
    apiClient,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 