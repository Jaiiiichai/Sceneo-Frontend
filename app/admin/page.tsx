'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { APIError, api } from '@/network';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const adminData = localStorage.getItem('sceneo_admin');
    if (adminData) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{
        success: boolean;
        data?: {
          admin?: {
            id?: number | string;
            email?: string;
          };
          token?: string;
        };
        message?: string;
      }>('/admin/login', { email, password });

      const admin = response.data?.admin;
      const token = response.data?.token;

      if (!response.success || !admin || !token) {
        throw new Error(response.message || 'Invalid email or password');
      }

      localStorage.setItem('sceneo_admin', JSON.stringify({
        id: admin.id,
        email: admin.email,
        name: admin.email || 'Admin',
      }));
      localStorage.setItem('authToken', token);
      router.push('/admin/dashboard');
    } catch (error) {
      const message = error instanceof APIError
        ? error.message
        : error instanceof Error
        ? error.message
        : 'Invalid email or password';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e5e7eb] px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-teal-700">Sceneo Studio</p>
          <h1 className="text-4xl font-black text-slate-950">Admin Panel</h1>
          <p className="mt-2 text-slate-600">Manage bookings, availability, and providers.</p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
          <h2 className="mb-6 text-2xl font-black text-slate-950">Sign In</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 transition-colors focus:border-slate-950 focus:bg-white focus:ring-0"
                  placeholder="admin@sceneo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 transition-colors focus:border-slate-950 focus:bg-white focus:ring-0"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg bg-slate-950 py-3 text-lg font-bold text-white transition-all ${
                loading ? 'cursor-not-allowed opacity-70' : 'hover:bg-slate-800 active:scale-95'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Use the admin account saved in the database.
          </p>
        </div>
      </div>
    </div>
  );
}
