'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const runCallback = async () => {
      const providerParam = searchParams.get('provider');
      const provider = providerParam === 'facebook' ? 'facebook' : 'google';
      const code = searchParams.get('code') || undefined;
      const token = searchParams.get('token') || searchParams.get('access_token') || undefined;
      const state = searchParams.get('state') || '/';

      try {
        const redirectPath = await completeOAuthLogin({
          provider,
          code,
          token,
          nextPath: state,
        });

        router.replace(redirectPath);
      } catch (callbackError) {
        console.error('OAuth callback failed:', callbackError);
        setError('OAuth login failed. Please try again.');
      }
    };

    runCallback();
  }, [completeOAuthLogin, router, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Authentication Failed</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.replace('/pages/Auth/login')}
            className="px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Signing you in...</h1>
        <p className="text-slate-600">Please wait while we complete your authentication.</p>
      </div>
    </main>
  );
}
