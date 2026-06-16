'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const router = useRouter();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);  // phone_number is optional, defaults to null
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      console.error('Signup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] p-4 pt-28">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.22em] text-rose-700">Sceneo</p>
        <h1 className="text-center text-4xl font-black text-slate-950 mb-2">
          Sign Up
        </h1>
        
        <p className="text-center text-slate-600 mb-8">
          Already have an account?{' '}
          <Link href="/pages/Auth/login" className="font-bold text-rose-700 hover:text-rose-800">
            Log In
            </Link>
        </p>

        <form onSubmit={handleEmailSignUp} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition-colors focus:border-slate-950"
              required
            />
          </div>

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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition-colors focus:border-slate-950"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-950 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
