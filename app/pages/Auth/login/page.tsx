'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.22em] text-rose-700">Sceneo</p>
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
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition-colors focus:border-slate-950"
              required
            />
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
