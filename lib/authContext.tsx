'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/network';
import { useToast } from '@/lib/toastContext';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface ApiUserLike {
  id?: number;
  user_id?: number;
  full_name?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (nextPath?: string) => Promise<void>;
  loginWithFacebook: (nextPath?: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phoneNumber?: string) => Promise<void>;
  logout: (silent?: boolean) => void;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed?: () => boolean;
            isSkippedMoment?: () => boolean;
            getNotDisplayedReason?: () => string;
            getSkippedReason?: () => string;
          }) => void) => void;
        };
      };
    };
    FB?: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken?: string } }) => void,
        options?: { scope?: string }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { showToast } = useToast();

  const mapUserFromApi = (userInfo: ApiUserLike | null | undefined, fallbackEmail?: string): User => ({
    id: userInfo?.id || userInfo?.user_id || 0,
    name: userInfo?.full_name || userInfo?.name || fallbackEmail?.split('@')[0] || 'User',
    email: userInfo?.email || fallbackEmail || '',
    phone: userInfo?.phone_number || userInfo?.phone,
    avatar: userInfo?.avatar || `https://ui-avatars.com/api/?name=${(userInfo?.full_name || userInfo?.name || fallbackEmail?.split('@')[0] || 'User')}&background=random`
  });

  const applyAuthSession = (authToken: string, userInfo?: ApiUserLike) => {
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    if (userInfo) {
      setUser(mapUserFromApi(userInfo));
    }
  };

  const fetchUserOnMount = useCallback(async () => {
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
        if (response.status === 401 || response.status === 404) {
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
        return;
      }

      const userData = await response.json();
      const userInfo = userData.data || userData.user || userData;

      setUser(mapUserFromApi(userInfo));
    } catch {}
  }, []);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data if token exists
      fetchUserOnMount();
    }
  }, [fetchUserOnMount]);

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
        if (response.status === 401 || response.status === 404) {
          logout(true);
        }
        return;
      }

      const userData = await response.json();

      const userInfo = userData.data || userData.user || userData;
      setUser(mapUserFromApi(userInfo));
    } catch {}
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
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let backendMessage = '';

        if (contentType.includes('application/json')) {
          const errorData: unknown = await response.json().catch(() => null);
          if (errorData && typeof errorData === 'object') {
            const payload = errorData as {
              message?: string;
              error?: string;
              data?: { message?: string };
            };
            backendMessage = payload.message || payload.error || payload.data?.message || '';
          }
        }

        if (!backendMessage) {
          backendMessage = await response.text().catch(() => '');
        }

        throw new Error(backendMessage || `Login failed with status ${response.status}`);
      }

      const userData = await response.json();

      // Handle nested response structure: { data: { token: "...", user: {...} } }
      const responseData = userData.data || userData;
      const authToken = responseData.token || userData.token || userData.access_token || userData.accessToken;
      const userInfo = responseData.user || userData.user || userData;
      
      // Store token if present in response
      if (authToken) {
        applyAuthSession(authToken, userInfo);
      } else {
      }

      setUser(mapUserFromApi(userInfo, email));

      showToast('Login successful. Welcome back!', 'success');
    } catch (error) {
      throw error; 
    }
  };

  const getSocialAuthEndpoint = (provider: 'google' | 'facebook') => {
    const envUrl = provider === 'google'
      ? process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL
      : process.env.NEXT_PUBLIC_FACEBOOK_AUTH_URL;

    if (envUrl) return envUrl;

    const normalizedBase = API_BASE_URL.replace(/\/$/, '');
    const hasApiSuffix = /\/api$/i.test(normalizedBase);
    return hasApiSuffix
      ? `${normalizedBase}/auth/${provider}`
      : `${normalizedBase}/api/auth/${provider}`;
  };

  const ensureGoogleSdk = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Google login is only available in the browser.');
    }

    if (window.google?.accounts?.id) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-sceneo-google-sdk="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google SDK.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.sceneoGoogleSdk = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google SDK.'));
      document.head.appendChild(script);
    });
  };

  const ensureFacebookSdk = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Facebook login is only available in the browser.');
    }

    if (window.FB) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-sceneo-facebook-sdk="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Facebook SDK.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.dataset.sceneoFacebookSdk = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Facebook SDK.'));
      document.head.appendChild(script);
    });
  };

  const requestGoogleIdToken = async (): Promise<string> => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend env.');
    }

    await ensureGoogleSdk();

    return new Promise<string>((resolve, reject) => {
      const googleIdentity = window.google?.accounts?.id;
      if (!googleIdentity) {
        reject(new Error('Google SDK is not available.'));
        return;
      }

      let settled = false;

      googleIdentity.initialize({
        client_id: clientId,
        callback: (response) => {
          if (settled) return;
          const idToken = response?.credential;
          if (!idToken) {
            settled = true;
            reject(new Error('Google did not return an id_token.'));
            return;
          }
          settled = true;
          resolve(idToken);
        },
      });

      googleIdentity.prompt((notification) => {
        if (settled) return;
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          settled = true;
          const reason = notification?.isNotDisplayed?.()
            ? notification?.getNotDisplayedReason?.()
            : notification?.getSkippedReason?.();
          reject(new Error(reason || 'Google sign-in prompt was not completed.'));
        }
      });
    });
  };

  const requestFacebookAccessToken = async (): Promise<string> => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      throw new Error('Missing NEXT_PUBLIC_FACEBOOK_APP_ID in frontend env.');
    }

    await ensureFacebookSdk();

    if (!window.FB) {
      throw new Error('Facebook SDK is not available.');
    }

    window.FB.init({
      appId,
      cookie: true,
      xfbml: false,
      version: 'v20.0',
    });

    return new Promise<string>((resolve, reject) => {
      window.FB?.login(
        (response) => {
          const accessToken = response?.authResponse?.accessToken;
          if (!accessToken) {
            reject(new Error('Facebook did not return an access_token.'));
            return;
          }
          resolve(accessToken);
        },
        { scope: 'email,public_profile' }
      );
    });
  };

  const loginWithSocialToken = async (provider: 'google' | 'facebook', socialToken: string) => {
    const endpoint = getSocialAuthEndpoint(provider);
    const payload = provider === 'google'
      ? { id_token: socialToken }
      : { access_token: socialToken };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `${provider} login failed with status ${response.status}`);
    }

    const userData = await response.json();
    const responseData = userData?.data || userData;
    const authToken = responseData?.token || userData?.token || userData?.access_token || userData?.accessToken;
    const userInfo = responseData?.user || userData?.user;

    if (!authToken) {
      throw new Error('No app auth token returned by backend social login endpoint.');
    }

    applyAuthSession(authToken, userInfo);
    if (!userInfo) {
      await fetchUser();
    }
    showToast('Login successful. Welcome back!', 'success');
  };

  const loginWithGoogle = async (nextPath = '/') => {
    void nextPath;
    const idToken = await requestGoogleIdToken();
    await loginWithSocialToken('google', idToken);
  };

  const loginWithFacebook = async (nextPath = '/') => {
    void nextPath;
    const accessToken = await requestFacebookAccessToken();
    await loginWithSocialToken('facebook', accessToken);
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

      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Signup failed with status ${response.status}`);
      }

      const userData = await response.json();

      // Handle nested response structure: { data: { token: "...", user: {...} } }
      const responseData = userData.data || userData;
      const authToken = responseData.token || userData.token;
      const userInfo = responseData.user || userData.user || userData;

      if (authToken) {
        applyAuthSession(authToken, userInfo);
        setUser(mapUserFromApi(userInfo, email));
      } else {
        // Some backends create user via /users but don't return auth token.
        // Immediately log in so user is actually authenticated after signup.
        await login(email, password);
      }

      showToast('Account created successfully.', 'success');
    } catch (error) {
      throw error;  // Re-throw so the calling component can handle it
    }
  };

  const logout = (silent = false) => {
    // Clear token from localStorage
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    if (!silent) {
      showToast('Logged out successfully.', 'info');
    }
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

