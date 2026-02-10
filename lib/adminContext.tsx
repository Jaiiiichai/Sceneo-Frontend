"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Admin {
  id: string;
  email: string;
  name: string;
}

interface AdminContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock admin login - replace with real API call
    if (email === 'admin@sceneo.com' && password === 'admin123') {
      const adminUser = {
        id: '1',
        email: 'admin@sceneo.com',
        name: 'Admin User'
      };
      setAdmin(adminUser);
      localStorage.setItem('sceneo_admin', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('sceneo_admin');
    router.push('/admin');
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
