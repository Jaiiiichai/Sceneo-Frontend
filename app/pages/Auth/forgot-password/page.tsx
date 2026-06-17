'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-lg shadow-sm w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Check your email
          </h1>
          
          <p className="text-gray-600 mb-8">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>

          <Link
            href="/pages/Auth/login"
            className="inline-block bg-black text-white px-6 py-3 rounded hover:bg-gray-900 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-lg shadow-sm w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Forgot Password?
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          Enter your email and we&apos;ll send you instructions to reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <Link href="/pages/Auth/login" className="text-blue-600 hover:text-blue-700 text-sm">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

