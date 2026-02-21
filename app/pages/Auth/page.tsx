'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pages/Auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
