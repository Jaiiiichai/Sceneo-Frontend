import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { bookingService } from '@/network/services/bookingService';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  useEffect(() => {
    if (!bookingId) {
      setStatus('error');
      setError('Missing booking ID.');
      return;
    }

    let isMounted = true;

    const pollStatus = async () => {
      try {
        const booking = await bookingService.getBookingById(bookingId);

        if (!isMounted) return true;

        if (booking.status === 'confirmed' || booking.status === 'completed') {
          setStatus('success');
          return true;
        }

        if (booking.status === 'cancelled') {
          setStatus('error');
          setError('Booking was cancelled.');
          return true;
        }

        return false;
      } catch (err) {
        if (!isMounted) return true;
        setStatus('error');
        setError('Failed to check booking status.');
        return true;
      }
    };

    pollStatus();
    const interval = setInterval(async () => {
      const done = await pollStatus();
      if (done) clearInterval(interval);
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bookingId]);

  useEffect(() => {
    if (status !== 'success') return;

    let remaining = 4;
    setRedirectCountdown(remaining);

    const interval = setInterval(() => {
      remaining -= 1;
      setRedirectCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        router.push('/pages/bookings');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, router]);

  const handleClose = () => {
    router.push('/pages/bookings');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <h2 className="text-xl font-bold mb-4">Processing Payment...</h2>
            <p className="mb-4">Please wait while we confirm your payment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-xl font-bold mb-4 text-emerald-600">Payment Successful!</h2>
            <p className="mb-4">Your booking is now confirmed.</p>
            <p className="text-xs text-gray-500">Redirecting to your bookings in {redirectCountdown || 4}s...</p>
            <button
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              onClick={handleClose}
            >
              Close
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold mb-4 text-rose-600">Payment Error</h2>
            <p className="mb-4">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
              onClick={handleClose}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
