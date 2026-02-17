'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { API_BASE_URL } from '@/network';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  signup: (name: string, email: string, password: string, phoneNumber?: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data if token exists
      fetchUserOnMount();
    }
  }, []);

  // Fetch current user data from /auth/me
  const fetchUser = async () => {
    const authToken = token || localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If token is invalid, clear it
        if (response.status === 401) {
          logout();
        }
        return;
      }

      const userData = await response.json();
      console.log('User data fetched:', userData);

      const userInfo = userData.data || userData.user || userData;

      setUser({
        id: userInfo.id || userInfo.user_id,
        name: userInfo.full_name || userInfo.name || userInfo.email?.split('@')[0],
        email: userInfo.email,
        phone: userInfo.phone_number || userInfo.phone,
        avatar: userInfo.avatar || `https://ui-avatars.com/api/?name=${(userInfo.full_name || userInfo.name || userInfo.email?.split('@')[0])}&background=random`
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // Helper for initial mount fetch
  const fetchUserOnMount = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          setToken(null);
        }
        return;
      }

      const userData = await response.json();
      const userInfo = userData.data || userData.user || userData;

      setUser({
        id: userInfo.id || userInfo.user_id,
        name: userInfo.full_name || userInfo.name || userInfo.email?.split('@')[0],
        email: userInfo.email,
        phone: userInfo.phone_number || userInfo.phone,
        avatar: userInfo.avatar || `https://ui-avatars.com/api/?name=${(userInfo.full_name || userInfo.name || userInfo.email?.split('@')[0])}&background=random`
      });
    } catch (error) {
      console.error('Error fetching user on mount:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Login response:', response);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login error response:', errorData);
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }

      const userData = await response.json();
      console.log('Login success - Full response:', userData);
      console.log('Available fields:', Object.keys(userData));

      // Handle nested response structure: { data: { token: "...", user: {...} } }
      const responseData = userData.data || userData;
      const authToken = responseData.token || userData.token || userData.access_token || userData.accessToken;
      const userInfo = responseData.user || userData.user || userData;
      
      console.log('Token found:', authToken);
      console.log('User info:', userInfo);

      // Store token if present in response
      if (authToken) {
        localStorage.setItem('authToken', authToken);
        setToken(authToken);
        console.log('✅ Token stored in localStorage:', authToken);
      } else {
        console.warn('⚠️ No token found in response! Response structure:', userData);
      }

      setUser({
        id: userInfo.id || userInfo.user_id,
        name: userInfo.full_name || userInfo.name || email.split('@')[0],
        email: userInfo.email || email,
        phone: userInfo.phone_number || userInfo.phone,
        avatar: userInfo.avatar || `https://ui-avatars.com/api/?name=${(userInfo.full_name || userInfo.name || email.split('@')[0])}&background=random`
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error; 
    }
  };

  const loginWithGoogle = async () => {
    // Simulate Google OAuth
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: 0, // Temporary ID for OAuth users
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=Google+User&background=random'
    });
  };

  const loginWithFacebook = async () => {
    // Simulate Facebook OAuth
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: 0, // Temporary ID for OAuth users
      name: 'Facebook User',
      email: 'user@facebook.com',
      avatar: 'https://ui-avatars.com/api/?name=Facebook+User&background=random'
    });
  };

  const signup = async (name: string, email: string, password: string, phoneNumber?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          full_name: name,  // Backend expects 'full_name', not 'name'
          email, 
          password,
          phone_number: phoneNumber || null  // Backend expects 'phone_number', can be null
        }),
      });

      console.log('Signup response:', response);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Signup error response:', errorData);
        throw new Error(errorData.message || `Signup failed with status ${response.status}`);
      }

      const userData = await response.json();
      console.log('Signup success - Full response:', userData);

      // Handle nested response structure: { data: { token: "...", user: {...} } }
      const responseData = userData.data || userData;
      const authToken = responseData.token || userData.token;
      const userInfo = responseData.user || userData.user || userData;

      // Store token if present in response
      if (authToken) {
        localStorage.setItem('authToken', authToken);
        setToken(authToken);
        console.log('✅ Token stored:', authToken);
      }

      setUser({
        id: userInfo.id || userInfo.user_id,
        name: userInfo.full_name || name,
        email: userInfo.email || email,
        phone: userInfo.phone_number || userInfo.phone || phoneNumber,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;  // Re-throw so the calling component can handle it
    }
  };

  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    console.log('✅ Logged out - token cleared');
  };

  // Helper function to get current token
  const getToken = () => {
    return token || localStorage.getItem('authToken');
  };

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return !!token || !!localStorage.getItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      login, 
      loginWithGoogle, 
      loginWithFacebook, 
      signup, 
      logout,
      getToken,
      isAuthenticated,
      fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
