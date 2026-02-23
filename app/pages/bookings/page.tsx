'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock3, Receipt, RefreshCw } from 'lucide-react';
import { api } from '@/network';
import { useAuth } from '@/lib/authContext';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/lib/toastContext';
import { xenditService } from '@/network/services/xenditService';
import { clearPendingPaymentBooking, getPendingPaymentBooking } from '@/lib/pendingPaymentBooking';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

type ApiBooking = {
  id: number | string;
  user_id?: number | string;
  booking_type?: 'professional_slots' | 'whole_studio' | 'Whole Studio' | 'Studio Slot' | string;
  booking_date?: string;
  booking_time?: string;
  booking_status?: BookingStatus | string;
  booking_price?: number | string;
  created_at?: string;
  providers?: {
    full_name?: string;
    service_type?: string;
  };
};

type HistoryBooking = {
  id: string;
  type: string;
  rawDate: string;
  rawTime: string;
  date: string;
  time: string;
  status: BookingStatus;
  price: string;
  provider?: string;
  createdAt: string;
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const [year, month, day] = value.split('-').map(Number);
  const safe = new Date(year || 1970, (month || 1) - 1, day || 1);
  return safe.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (value?: string) => {
  if (!value) return 'N/A';
  const [hourPart = '0', minutePart = '0'] = value.split(':');
  let hours = Number(hourPart);
  const minutes = minutePart.padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
};

const statusClasses: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const normalizeStatus = (status?: string): BookingStatus => {
  if (status === 'pending' || status === 'confirmed' || status === 'completed' || status === 'cancelled') {
    return status;
  }
  return 'pending';
};

const toHistoryBooking = (booking: ApiBooking): HistoryBooking => {
  const bookingType = booking.booking_type === 'whole_studio' || booking.booking_type === 'Whole Studio'
    ? 'Whole Studio'
    : 'Studio Slot';

  return {
    id: String(booking.id),
    type: bookingType,
    rawDate: booking.booking_date || '',
    rawTime: booking.booking_time || '',
    date: formatDate(booking.booking_date),
    time: formatTime(booking.booking_time),
    status: normalizeStatus(booking.booking_status),
    price: `₱${Number(booking.booking_price || 0).toLocaleString()}`,
    provider: booking.providers?.full_name,
    createdAt: booking.created_at ? formatDate(booking.created_at.split('T')[0]) : 'N/A',
  };
};

export default function BookingsHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, fetchUser } = useAuth();
  const { clearCart } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<HistoryBooking[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelModal, setCancelModal] = useState<HistoryBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [trackedPaymentInvoiceId, setTrackedPaymentInvoiceId] = useState<string | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);

  const parseBookingDateTime = (booking: HistoryBooking): Date | null => {
    if (!booking.rawDate || !booking.rawTime) return null;

    const [year, month, day] = booking.rawDate.split('-').map(Number);
    if (!year || !month || !day) return null;

    const timeParts = booking.rawTime.split(':');
    const hours = Number(timeParts[0] || '0');
    const minutes = Number(timeParts[1] || '0');
    const seconds = Number(timeParts[2] || '0');

    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  const isInsideCancellationWindow = (booking: HistoryBooking) => {
    const bookingDateTime = parseBookingDateTime(booking);
    if (!bookingDateTime) return false;

    const threeHoursBefore = new Date(bookingDateTime.getTime() - 3 * 60 * 60 * 1000);
    return new Date() >= threeHoursBefore;
  };

  const isPastBooking = (booking: HistoryBooking) => {
    const bookingDateTime = parseBookingDateTime(booking);
    if (!bookingDateTime) return false;
    return bookingDateTime.getTime() < Date.now();
  };

  const loadBookings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      if (!isAuthenticated()) {
        const nextPath = '/pages/bookings';
        router.push(`/pages/Auth/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      await fetchUser();

      const response = await api.get('/bookings', { requiresAuth: true });
      const rawBookings: ApiBooking[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const currentUserId = user?.id != null ? String(user.id) : null;
      const ownedBookings = rawBookings.filter((booking) => {
        if (!currentUserId) return true;
        if (booking.user_id == null) return true;
        return String(booking.user_id) === currentUserId;
      });

      setBookings(ownedBookings.map(toHistoryBooking));
    } catch (err) {
      console.error('Failed to load booking history:', err);
      setError('Unable to load your bookings right now. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('invoiceId');
    const payment = params.get('payment');

    if (payment === 'processing' && invoiceId) {
      setTrackedPaymentInvoiceId(invoiceId);
      showToast('Waiting for payment confirmation...', 'info');
      return;
    }

    const pendingDraft = getPendingPaymentBooking();
    if (pendingDraft?.invoiceId) {
      setTrackedPaymentInvoiceId(String(pendingDraft.invoiceId));
      showToast('Resuming payment confirmation...', 'info');
    }
  }, [showToast]);

  useEffect(() => {
    if (!trackedPaymentInvoiceId || !isAuthenticated()) return;

    let cancelled = false;
    let pollTimeoutId: number | null = null;

    const pollPaymentStatus = async () => {
      if (cancelled) return;
      setPaymentPolling(true);

      try {
        const latestInvoice = await xenditService.getInvoice(trackedPaymentInvoiceId);
        const paymentStatus = String(latestInvoice.status || '').toUpperCase();
        const isPaid = paymentStatus === 'PAID' || paymentStatus === 'SETTLED' || paymentStatus === 'SUCCEEDED';
        const isFinalUnpaid = paymentStatus === 'EXPIRED' || paymentStatus === 'FAILED';

        if (isPaid) {
          if (!cancelled) {
            clearPendingPaymentBooking();
            await clearCart();
            await loadBookings(true);
            setShowPaymentSuccessModal(true);
            setTrackedPaymentInvoiceId(null);
            setPaymentPolling(false);
            router.replace('/pages/bookings');
          }
          return;
        }

        if (isFinalUnpaid) {
          if (!cancelled) {
            setPaymentPolling(false);
            setTrackedPaymentInvoiceId(null);
            clearPendingPaymentBooking();
            showToast('Payment was not completed. Please try again.', 'error');
            router.replace('/pages/bookings');
          }
          return;
        }
      } catch (pollError) {
        console.error('Failed to poll payment status:', pollError);
      }

      pollTimeoutId = window.setTimeout(pollPaymentStatus, 5000);
    };

    const startPolling = async () => {
      if (!isAuthenticated()) {
        try {
          await fetchUser();
        } catch {
          // Keep polling flow resilient while auth context initializes
        }
      }

        if (!cancelled) {
          pollPaymentStatus();
        }
    };

    startPolling();

    return () => {
      cancelled = true;
      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId);
      }
      setPaymentPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedPaymentInvoiceId, isAuthenticated, fetchUser, router]);

  const filteredBookings = (() => {
    const timelineFiltered = bookings.filter((booking) => {
      const past = isPastBooking(booking);
      return timelineFilter === 'upcoming' ? !past : past;
    });

    return [...timelineFiltered].sort((a, b) => {
      const aDate = parseBookingDateTime(a)?.getTime() ?? 0;
      const bDate = parseBookingDateTime(b)?.getTime() ?? 0;
      return timelineFilter === 'upcoming' ? aDate - bDate : bDate - aDate;
    });
  })();

  const requestCancelBooking = (booking: HistoryBooking) => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      showToast('Only pending or confirmed bookings can be cancelled.', 'error');
      return;
    }

    if (isPastBooking(booking)) {
      showToast('This booking has already passed and can no longer be cancelled.', 'error');
      return;
    }

    if (isInsideCancellationWindow(booking)) {
      showToast('Cancellation is not allowed within 3 hours of the booking time.', 'error');
      return;
    }

    setCancelModal(booking);
  };

  const confirmCancelBooking = async () => {
    if (!cancelModal) return;

    try {
      setCancelling(true);
      await api.put(`/bookings/${cancelModal.id}`, {
        booking_status: 'cancelled',
      }, { requiresAuth: true });

      setBookings((prev) => prev.map((booking) => (
        booking.id === cancelModal.id
          ? { ...booking, status: 'cancelled' }
          : booking
      )));

      showToast('Booking cancelled successfully.', 'success');
      setCancelModal(null);
    } catch (cancelError) {
      console.error('Failed to cancel booking:', cancelError);
      showToast('Unable to cancel booking right now. Please try again.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">My Booking History</h1>
            <p className="text-slate-600 mt-2">Track all your past and upcoming studio bookings.</p>
            {paymentPolling && (
              <p className="text-sm text-blue-700 mt-2">
                Checking payment status for your latest booking...
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Timeline</p>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTimelineFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                timelineFilter === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('past')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                timelineFilter === 'past'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">Loading your bookings...</div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => loadBookings(true)}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-800 font-semibold mb-2">
              {timelineFilter === 'upcoming' ? 'No upcoming bookings found.' : 'No past bookings found.'}
            </p>
            <p className="text-slate-600 mb-6">
              {timelineFilter === 'upcoming'
                ? 'Once you make a new booking, it will appear here.'
                : 'Your completed or elapsed bookings will appear here.'}
            </p>
            {timelineFilter === 'upcoming' && (
              <Link
                href="/pages/booking"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                Book a Studio
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{booking.type}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPastBooking(booking) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                        PAST
                      </span>
                    )}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClasses[booking.status]}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock3 className="w-4 h-4" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Receipt className="w-4 h-4" />
                    <span>{booking.price}</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Booked on:</span> {booking.createdAt}
                  </div>
                </div>

                {booking.provider && (
                  <p className="mt-4 text-sm text-slate-700">
                    <span className="font-semibold">Provider:</span> {booking.provider}
                  </p>
                )}

                {(booking.status === 'pending' || booking.status === 'confirmed') && !isPastBooking(booking) && (
                  <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Cancellation allowed only up to 3 hours before booking time.
                    </p>
                    <button
                      type="button"
                      onClick={() => requestCancelBooking(booking)}
                      className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}

                {(booking.status === 'pending' || booking.status === 'confirmed') && isPastBooking(booking) && (
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      This booking has already passed.
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 border border-slate-200 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Cancellation</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to cancel booking <span className="font-semibold">#{cancelModal.id}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModal(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-60"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={confirmCancelBooking}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-60"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPaymentSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 border border-slate-200 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful</h3>
              <p className="text-slate-600 mb-6">
                Your booking is done and payment was received successfully.
              </p>
              <button
                type="button"
                onClick={() => setShowPaymentSuccessModal(false)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Great
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
