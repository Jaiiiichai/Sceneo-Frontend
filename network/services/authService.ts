/**
 * Authentication Service
 * Handles all auth-related API calls
 */

import api, { API_ENDPOINTS } from '../index';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  /**
   * Sign up new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.auth.signup,
      data
    );
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.auth.logout, {}, { requiresAuth: true });
    } finally {
      // Always remove token, even if API call fails
      localStorage.removeItem('authToken');
    }
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.auth.refresh,
      {},
      { requiresAuth: true }
    );
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.auth.forgotPassword, data);
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.auth.resetPassword, data);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get stored auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};

export default authService;
