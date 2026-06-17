'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CalendarClock, Camera, Home, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

type ProfileFieldProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

function ProfileField({ label, value, icon }: ProfileFieldProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-semibold text-slate-950">{value || 'N/A'}</p>
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
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [fetchUser, isAuthenticated, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#e5e7eb] pt-28">
        <div className="mx-auto max-w-4xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">Loading profile...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#e5e7eb] pt-28">
        <div className="mx-auto max-w-4xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="mb-2 font-semibold text-slate-800">Profile is unavailable.</p>
            <p className="mb-6 text-slate-600">Please log in again to continue.</p>
            <Link href="/pages/Auth/login?next=%2Fpages%2Fprofile" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initials = (user.name || user.email || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <main className="min-h-screen bg-[#e5e7eb] pt-28">
      <div className="mx-auto max-w-5xl px-4 pb-14 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-lg">
          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || 'Profile avatar'}
                width={112}
                height={112}
                className="h-24 w-24 rounded-lg border border-white/20 object-cover sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-white/20 bg-white text-3xl font-black text-slate-950 sm:h-28 sm:w-28">
                {initials || 'S'}
              </div>
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Sceneo Studio account</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{user.name || 'Sceneo Studio Guest'}</h1>
              <p className="mt-2 max-w-2xl text-slate-300">Manage your contact details and jump back into your booking flow whenever you need.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField label="Full Name" value={user.name || ''} icon={<UserIcon className="h-5 w-5" />} />
          <ProfileField label="Email" value={user.email || ''} icon={<Mail className="h-5 w-5" />} />
          <ProfileField label="Phone" value={user.phone || 'Not provided'} icon={<Phone className="h-5 w-5" />} />
          <ProfileField label="Bookings" value="View upcoming and past sessions" icon={<CalendarClock className="h-5 w-5" />} />
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Ready for your next session?</h2>
              <p className="mt-1 text-sm text-slate-600">Book a studio slot or review your active reservations from here.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/pages/booking" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
                <Camera className="h-4 w-4" />
                Book Now
              </Link>
              <Link href="/pages/bookings" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                <CalendarClock className="h-4 w-4" />
                My Bookings
              </Link>
              <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}



