import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import authService from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  const clearNotice = useCallback(() => setAuthNotice(null), []);

  // Initialize and verify session against FastAPI backend on mount
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const session = await authService.checkSession();
        if (isMounted && session.isAuthenticated) {
          setUser(session.user);
          setToken(session.token);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Session check info:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user through FastAPI endpoint /api/auth/login
   */
  const login = async (credentials) => {
    setIsLoading(true);
    setAuthNotice(null);
    try {
      const result = await authService.login(credentials);
      if (result.success && result.user) {
        setUser(result.user);
        setToken(result.token);
        setIsAuthenticated(true);
      }
      return result;
    } catch (err) {
      setAuthNotice({
        type: 'error',
        title: 'Sign In Failed',
        message: err.message || 'Invalid email or password.',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register user through FastAPI endpoint /api/auth/register
   */
  const signup = async (userData) => {
    setIsLoading(true);
    setAuthNotice(null);
    try {
      const result = await authService.signup(userData);
      if (result.success && result.user) {
        setUser(result.user);
        setToken(result.token);
        setIsAuthenticated(true);
      }
      return result;
    } catch (err) {
      setAuthNotice({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Unable to complete registration.',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setAuthNotice(null);
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    authNotice,
    clearNotice,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
