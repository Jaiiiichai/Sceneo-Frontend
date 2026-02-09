'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string) => {
    // Simulate API call - in production, password would be validated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock login - in production, this would validate credentials
    setUser({
      name: email.split('@')[0],
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
    });
  };

  const loginWithGoogle = async () => {
    // Simulate Google OAuth
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      name: 'Google User',
      email: 'user@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=Google+User&background=random'
    });
  };

  const loginWithFacebook = async () => {
    // Simulate Facebook OAuth
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      name: 'Facebook User',
      email: 'user@facebook.com',
      avatar: 'https://ui-avatars.com/api/?name=Facebook+User&background=random'
    });
  };

  const signup = async (name: string, email: string) => {
    // Simulate API call - in production, password would be validated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUser({
      name: name,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginWithFacebook, signup, logout }}>
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
