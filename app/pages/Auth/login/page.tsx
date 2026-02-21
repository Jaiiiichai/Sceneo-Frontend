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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-lg shadow-sm w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Log In
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          New to this site?{' '}
          <Link href="/pages/Auth/signup" className="text-red-600 hover:text-red-700">
            Sign Up
          </Link>
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-gray-300 focus:border-gray-900 outline-none px-1 py-2 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-gray-300 focus:border-gray-900 outline-none px-1 py-2 transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div>
            <Link href="/pages/Auth/forgot-password" className="text-blue-600 hover:text-blue-700 text-sm">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
