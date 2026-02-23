import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { xenditService } from '@/network/services/xenditService';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setStatus('error');
      setError('Missing booking ID.');
      return;
    }
    // Poll backend for booking status
    const interval = setInterval(async () => {
      try {
        const booking = await xenditService.getInvoice(bookingId);
        if (booking.status === 'PAID' || booking.status === 'paid') {
          setStatus('success');
          clearInterval(interval);
        }
      } catch (err) {
        setStatus('error');
        setError('Failed to check payment status.');
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [bookingId]);

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
