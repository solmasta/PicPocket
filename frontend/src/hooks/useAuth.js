import { useState, useEffect, useCallback } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import { ApiError } from '../services/api';

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    const expiry = localStorage.getItem('token_expiry');

    if (!token || !expiry) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }

    if (Date.now() >= parseInt(expiry, 10)) {
      await handleRefreshToken();
      return isAuthenticated;
    }

    try {
      const response = await api.get('/api/auth/status');
      setUser(response.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await handleRefreshToken();
      } else {
        console.error('Auth check failed:', err);
        clearAuth();
      }
      setIsLoading(false);
      return false;
    }
  }, []);

  const handleRefreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      clearAuth();
      return false;
    }

    try {
      const response = await api.post('/api/auth/refresh', {
        refreshToken,
      });

      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('token_expiry', response.expiresAt);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
      }
      console.error('Token refresh failed:', err);
      return false;
    }
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post('/api/auth/google', {
          token: tokenResponse.access_token,
        });

        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('refresh_token', response.refreshToken);
          localStorage.setItem('token_expiry', response.expiresAt);
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Login failed:', err);
        setError(err.message || 'Login failed. Please try again.');
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google login error:', errorResponse);
      setError('Google sign-in failed. Please try again.');
      setIsLoading(false);
    },
  });

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout API call failed, clearing local auth anyway:', err);
    } finally {
      try {
        googleLogout();
      } catch (err) {
        console.warn('Google logout failed:', err);
      }
      clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem('token_expiry')) return;

    const expiryTime = parseInt(localStorage.getItem('token_expiry'), 10);
    const timeUntilRefresh = expiryTime - Date.now() - TOKEN_REFRESH_THRESHOLD;

    if (timeUntilRefresh > 0) {
      const refreshTimer = setTimeout(() => {
        handleRefreshToken();
      }, timeUntilRefresh);

      return () => clearTimeout(refreshTimer);
    }
  }, [isAuthenticated, handleRefreshToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearAuth,
    refreshToken: handleRefreshToken,
  };
};

export default useAuth;