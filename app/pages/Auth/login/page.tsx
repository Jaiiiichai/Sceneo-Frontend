'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch {
      setError('Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      await loginWithFacebook();
      router.push('/');
    } catch {
      setError('Failed to login with Facebook');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (!showEmailForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.8 10.2273C19.8 9.51825 19.7364 8.83643 19.6182 8.18188H10V12.0501H15.4818C15.2273 13.3001 14.5182 14.3592 13.4727 15.0682V17.5773H16.7727C18.6727 15.8364 19.8 13.2728 19.8 10.2273Z" fill="#4285F4"/>
                <path d="M10 20C12.7 20 14.9636 19.1045 16.7727 17.5773L13.4727 15.0682C12.6045 15.6682 11.4818 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H0.995454V14.4909C2.79091 18.0682 6.10909 20 10 20Z" fill="#34A853"/>
                <path d="M4.40455 11.9C4.18182 11.3 4.05455 10.6591 4.05455 10C4.05455 9.34091 4.18182 8.7 4.40455 8.1V5.50909H0.995454C0.36364 6.76818 0 8.18182 0 10C0 11.8182 0.36364 13.2318 0.995454 14.4909L4.40455 11.9Z" fill="#FBBC04"/>
                <path d="M10 3.97727C11.6227 3.97727 13.0636 4.51818 14.2045 5.59091L17.1409 2.65455C14.9591 0.636364 12.6955 -0.0272727 10 -0.0272727C6.10909 -0.0272727 2.79091 1.90455 0.995454 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
              </svg>
              Log in with Google
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white px-6 py-3 rounded hover:bg-[#1565C0] transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
              </svg>
              Log in with Facebook
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-50 transition-colors"
            >
              Log in with Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or log in with</span>
            </div>
          </div>

          <div className="flex justify-center gap-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.8 10.2273C19.8 9.51825 19.7364 8.83643 19.6182 8.18188H10V12.0501H15.4818C15.2273 13.3001 14.5182 14.3592 13.4727 15.0682V17.5773H16.7727C18.6727 15.8364 19.8 13.2728 19.8 10.2273Z" fill="#4285F4"/>
                <path d="M10 20C12.7 20 14.9636 19.1045 16.7727 17.5773L13.4727 15.0682C12.6045 15.6682 11.4818 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H0.995454V14.4909C2.79091 18.0682 6.10909 20 10 20Z" fill="#34A853"/>
                <path d="M4.40455 11.9C4.18182 11.3 4.05455 10.6591 4.05455 10C4.05455 9.34091 4.18182 8.7 4.40455 8.1V5.50909H0.995454C0.36364 6.76818 0 8.18182 0 10C0 11.8182 0.36364 13.2318 0.995454 14.4909L4.40455 11.9Z" fill="#FBBC04"/>
                <path d="M10 3.97727C11.6227 3.97727 13.0636 4.51818 14.2045 5.59091L17.1409 2.65455C14.9591 0.636364 12.6955 -0.0272727 10 -0.0272727C6.10909 -0.0272727 2.79091 1.90455 0.995454 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <svg width="32" height="32" viewBox="0 0 20 20" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
