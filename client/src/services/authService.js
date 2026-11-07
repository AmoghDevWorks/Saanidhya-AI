import api, { getErrorMessage } from './api';

/**
 * Authentication Service
 * 
 * Production-ready abstraction layer connected to FastAPI backend:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - GET  /api/auth/me
 * - POST /api/auth/logout
 * 
 * Token Storage Strategy:
 * Currently persists the JWT in localStorage for initial development ease.
 * In production environments requiring high security against XSS, this can be
 * transitioned to secure, HttpOnly, SameSite=Strict cookies without changing
 * the application-level API contract.
 */

const TOKEN_KEY = 'saanidhya_auth_token';
const USER_KEY = 'saanidhya_user';

export const authService = {
  /**
   * Log in user with email & password via FastAPI backend.
   * 
   * @param {Object} credentials - { email, password, rememberMe }
   * @returns {Promise<Object>} { success, user, token, message }
   */
  async login({ email, password, rememberMe = false }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      const { accessToken, user, message } = response.data;

      // Store authenticated credentials
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      return {
        success: true,
        user,
        token: accessToken,
        message: message || 'Login successful.',
      };
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      throw new Error(errorMsg);
    }
  },

  /**
   * Register a new user (Elderly User or Family Member) via FastAPI backend.
   * 
   * @param {Object} userData - { fullName, email, password, confirmPassword, accountType, termsAccepted }
   * @returns {Promise<Object>} { success, user, token, message }
   */
  async signup({
    fullName,
    email,
    password,
    confirmPassword,
    accountType,
    termsAccepted,
  }) {
    if (!fullName || !email || !password || !accountType) {
      throw new Error('All required fields must be completed.');
    }

    try {
      const response = await api.post('/api/auth/register', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword: confirmPassword || password,
        accountType,
        termsAccepted: Boolean(termsAccepted),
      });

      const { accessToken, user, message } = response.data;

      // Store authenticated credentials on successful registration
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      return {
        success: true,
        user,
        token: accessToken,
        message: message || 'Account created successfully.',
      };
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      throw new Error(errorMsg);
    }
  },

  /**
   * Fetch current authenticated user profile from GET /api/auth/me
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      const user = response.data;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      throw error;
    }
  },

  /**
   * Verify session on load: checks localStorage token against /api/auth/me
   */
  async checkSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { isAuthenticated: false, user: null, token: null };
    }

    try {
      const user = await this.getCurrentUser();
      return { isAuthenticated: true, user, token };
    } catch {
      return { isAuthenticated: false, user: null, token: null };
    }
  },

  /**
   * Log out user: clears localStorage and informs backend
   */
  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Stateless token removal proceeds even if network drops
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return { success: true };
  },

  /**
   * Retrieve cached user from localStorage if present
   */
  getStoredUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
};

export default authService;
