'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 100);

    if (!bookingId) {
      setStatus('error');
      setError('Missing booking ID.');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      setStatus('error');
      setError('Missing authentication token.');
      return;
    }
    fetch(`http://localhost:4000/api/bookings/${bookingId}/is-paid`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.paid) {
          setStatus('success');
        } else {
          setStatus('error');
          setError('Payment not successful.');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Failed to check payment status.');
      });
  }, [bookingId]);

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-2xl p-10 text-center bg-white shadow-2xl transition-all duration-700 mt-20 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >

      {/* PROCESSING */}
      {status === 'processing' && (
        <>
          <div className="relative w-20 h-20 mx-auto mb-7">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" style={{ animationDuration: '1.2s' }} />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-300 animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-indigo-200 animate-spin" style={{ animationDuration: '2.4s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Confirming Payment</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Hang tight — we're verifying your transaction with our payment provider.
          </p>
          <p className="text-xs text-gray-300 tracking-wide">This usually takes just a moment</p>
        </>
      )}

      {/* SUCCESS */}
      {status === 'success' && (
        <>
          <div className="relative w-20 h-20 mx-auto mb-7">
            <div className="absolute inset-0 rounded-full bg-emerald-50 ring-1 ring-emerald-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                <circle
                  cx="26" cy="26" r="24"
                  stroke="#10b981" strokeWidth="2" fill="none"
                  strokeDasharray="166" strokeDashoffset="166"
                  style={{ animation: 'stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards' }}
                />
                <path
                  d="M14 26l8 8 16-16"
                  stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  strokeDasharray="48" strokeDashoffset="48"
                  style={{ animation: 'stroke 0.4s cubic-bezier(0.65,0,0.45,1) 0.5s forwards' }}
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Payment Confirmed</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-7">
            Your studio session is booked and confirmed. We can't wait to see you!
          </p>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-7 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Slot Reserved</p>
              <p className="text-xs text-gray-400 mt-0.5">Your time slot is secured and ready</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/pages/bookings')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            View My Bookings
          </button>
        </>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <>
          <div className="relative w-20 h-20 mx-auto mb-7">
            <div className="absolute inset-0 rounded-full bg-red-50 ring-1 ring-red-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                <circle
                  cx="26" cy="26" r="24"
                  stroke="#ef4444" strokeWidth="2" fill="none"
                  strokeDasharray="166" strokeDashoffset="166"
                  style={{ animation: 'stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards' }}
                />
                <path
                  d="M18 18l16 16"
                  stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none"
                  strokeDasharray="30" strokeDashoffset="30"
                  style={{ animation: 'stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.5s forwards' }}
                />
                <path
                  d="M34 18L18 34"
                  stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none"
                  strokeDasharray="30" strokeDashoffset="30"
                  style={{ animation: 'stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.6s forwards' }}
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Payment Failed</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-7">
            {error || 'Something went wrong during payment verification. Please try again or contact support.'}
          </p>

          <div className="h-px bg-gray-100 mb-7" />

          <button
            onClick={() => router.push('/pages/bookings')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/pages/booking')}
            className="w-full mt-2.5 py-3.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 font-medium text-sm hover:bg-gray-100 hover:text-gray-600 active:scale-95 transition-all duration-200"
          >
            Back to Booking
          </button>
        </>
      )}

      <style>{`
        @keyframes stroke { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}