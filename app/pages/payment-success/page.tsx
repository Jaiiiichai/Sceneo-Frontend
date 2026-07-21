'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Home, Loader2, CalendarDays, AlertCircle } from 'lucide-react';
import { bookingService } from '@/network/services/bookingService';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    bookingId ? 'processing' : 'success'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;

    const pollStatus = async () => {
      try {
        const booking = await bookingService.getBookingById(bookingId);
        if (!isMounted) return true;

        const bookingStatus = booking.status ?? booking.booking_status;

        if (bookingStatus === 'paid' || bookingStatus === 'confirmed' || bookingStatus === 'completed') {
          setStatus('success');
          return true;
        }

        if (bookingStatus === 'cancelled') {
          setStatus('error');
          setError('This booking was cancelled.');
          return true;
        }

        return false;
      } catch {
        if (!isMounted) return true;
        setStatus('error');
        setError('We could not verify this payment yet. Please check your bookings or contact support.');
        return true;
      }
    };

    pollStatus();
    const interval = window.setInterval(async () => {
      const done = await pollStatus();
      if (done) window.clearInterval(interval);
    }, 2000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [bookingId]);

  return (
    <main className="min-h-screen bg-[#e5e7eb] px-4 py-16">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10">
          {status === 'processing' && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-white">
                <Loader2 className="animate-spin" size={34} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Payment Verification</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Confirming your payment</h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
                Hang tight while we confirm your transaction. This usually takes just a moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Payment Received</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Your payment was successful</h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
                Thank you for booking with Sceneo Studio. Your payment has been received successfully.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 transition-colors hover:bg-slate-50"
                >
                  <Home size={18} />
                  Return Home
                </Link>
                <Link
                  href="/pages/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-4 text-sm font-black text-white transition-colors hover:bg-slate-800"
                >
                  <CalendarDays size={18} />
                  Go to Bookings
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200">
                <AlertCircle size={40} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Payment Status</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Payment needs review</h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
                {error || 'We could not confirm this payment yet. Please check your bookings for the latest status.'}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 transition-colors hover:bg-slate-50"
                >
                  <Home size={18} />
                  Return Home
                </Link>
                <Link
                  href="/pages/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-4 text-sm font-black text-white transition-colors hover:bg-slate-800"
                >
                  <CalendarDays size={18} />
                  Check Bookings
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e5e7eb]" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
