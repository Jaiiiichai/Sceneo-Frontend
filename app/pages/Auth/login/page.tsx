'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const getRedirectPath = () => {
    if (typeof window === 'undefined') {
      return '/';
    }
    const next = new URLSearchParams(window.location.search).get('next');
    if (!next || !next.startsWith('/')) {
      return '/';
    }
    return next;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push(getRedirectPath());
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] p-4 pt-28">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.22em] text-rose-700">Sceneo Studio</p>
        <h1 className="text-center text-4xl font-black text-slate-950 mb-2">
          Log In
        </h1>
        
        <p className="text-center text-slate-600 mb-8">
          New to this site?{' '}
          <Link href="/pages/Auth/signup" className="font-bold text-rose-700 hover:text-rose-800">
            Sign Up
          </Link>
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition-colors focus:border-slate-950"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 outline-none transition-colors focus:border-slate-950"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div>
            <Link href="/pages/Auth/forgot-password" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-950 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
