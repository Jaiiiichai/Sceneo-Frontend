'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Phone, User as UserIcon, CalendarClock } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

type ProfileFieldProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

function ProfileField({ label, value, icon }: ProfileFieldProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center gap-2 text-slate-800">
        <span className="text-slate-500">{icon}</span>
        <span className="font-medium">{value || 'N/A'}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated()) {
        router.push('/pages/Auth/login?next=%2Fpages%2Fprofile');
        return;
      }

      try {
        await fetchUser();
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [fetchUser, isAuthenticated, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading profile...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-800 font-semibold mb-2">Profile is unavailable.</p>
            <p className="text-slate-600 mb-6">Please log in again to continue.</p>
            <Link href="/pages/Auth/login?next=%2Fpages%2Fprofile" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-200">
            <Image
              src={user.avatar || ''}
              alt={user.name}
              width={84}
              height={84}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-slate-200"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-600 mt-1">Your account details and contact information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <ProfileField label="Full Name" value={user.name || ''} icon={<UserIcon className="w-4 h-4" />} />
            <ProfileField label="Email" value={user.email || ''} icon={<Mail className="w-4 h-4" />} />
            <ProfileField label="Phone" value={user.phone || 'Not provided'} icon={<Phone className="w-4 h-4" />} />
            <ProfileField label="Bookings" value="View your history" icon={<CalendarClock className="w-4 h-4" />} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pages/bookings" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              My Bookings
            </Link>
            <Link href="/" className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
