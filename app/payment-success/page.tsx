'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      setStatus('error');
      setError('Missing authentication token.');
      return;
    }
    // Check payment status once
    fetch(`http://localhost:4000/api/bookings/${bookingId}/is-paid`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log('Payment status API response:', data);
        if (data.success && data.paid) {
          setStatus('success');
        } else {
          setStatus('error');
          setError('Payment not successful.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setError('Failed to check payment status.');
        console.log('Payment status API error:', err);
      });
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
