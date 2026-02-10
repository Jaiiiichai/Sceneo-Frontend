'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    // Mock admin login - replace with real API call
    if (email === 'admin@sceneo.com' && password === 'admin123') {
      const adminUser = {
        id: '1',
        email: 'admin@sceneo.com',
        name: 'Admin User'
      };
      localStorage.setItem('sceneo_admin', JSON.stringify(adminUser));
      router.push('/admin/dashboard');
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2">SCENEO</h1>
          <p className="text-gray-400 text-lg">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-colors"
                  placeholder="admin@sceneo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white py-3 rounded-xl font-bold text-lg transition-all ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800 transform hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs mt-1">admin@sceneo.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
