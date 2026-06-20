'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, CalendarClock, Clock3, CreditCard, Plus, Receipt, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '@/network';
import { useAuth } from '@/lib/authContext';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/lib/toastContext';
import { xenditService } from '@/network/services/xenditService';
import { clearPendingPaymentBooking, getPendingPaymentBooking, setPendingPaymentBooking } from '@/lib/pendingPaymentBooking';
import { paymongoService } from '@/network/services/paymongoService';
import { PAYMENT_STORAGE_EVENT } from '@/components/GlobalPaymentMonitor';
import { filterSlotsByBookingType, getSlotsForDate, isSlotTooClose, TimeSlot } from '@/lib/timeSlots';

type BookingStatus = 'pending' | 'paid' | 'completed' | 'cancelled';

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
  booking_addons?: Array<{
    provider_name_snapshot?: string;
    service_type?: string;
    duration_minutes?: number | null;
    start_offset_minutes?: number | null;
  }>;
};

type HistoryBooking = {
  id: string;
  type: string;
  bookingType: 'professional_slots' | 'whole_studio';
  rawDate: string;
  rawTime: string;
  date: string;
  time: string;
  status: BookingStatus;
  price: string;
  priceAmount: number;
  provider?: string;
  createdAt: string;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const formatAddonServiceType = (serviceType?: string) => {
  if (serviceType === 'photography') return 'Photographer';
  if (serviceType === 'editor') return 'Editor';
  if (serviceType === 'make_up_artist') return 'Make-up Artist';
  if (serviceType === 'make_up_artist_false_lashes') return 'HMUA Add-on';
  if (serviceType === 'make_up_artist_touch_up') return 'HMUA Request';
  if (serviceType === 'make_up_artist_hair_extensions') return 'HMUA Request';
  return (serviceType || 'Service').split('_').join(' ');
};

const formatPhotographyDuration = (durationMinutes?: number | null, startOffsetMinutes?: number | null) => {
  if (durationMinutes === 30 && Number(startOffsetMinutes || 0) === 0) return 'First 30 mins';
  if (durationMinutes === 30 && Number(startOffsetMinutes || 0) === 30) return 'Last 30 mins';
  if (durationMinutes === 60) return 'Full 1 hour';
  if (durationMinutes) return `${durationMinutes} minutes`;
  return '';
};

const formatBookingAddon = (addon: NonNullable<ApiBooking['booking_addons']>[number]) => {
  const base = `${formatAddonServiceType(addon.service_type)}: ${addon.provider_name_snapshot || 'Provider'}`;
  if (addon.service_type !== 'photography') return base;

  const durationLabel = formatPhotographyDuration(addon.duration_minutes, addon.start_offset_minutes);
  return durationLabel ? `${base} (${durationLabel})` : base;
};

const statusClasses: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const normalizeStatus = (status?: string): BookingStatus => {
  if (status === 'pending' || status === 'paid' || status === 'completed' || status === 'cancelled') {
    return status;
  }
  return 'pending';
};

const toHistoryBooking = (booking: ApiBooking): HistoryBooking => {
  const normalizedBookingType = booking.booking_type === 'whole_studio' || booking.booking_type === 'Whole Studio'
    ? 'whole_studio'
    : 'professional_slots';
  const bookingType = normalizedBookingType === 'whole_studio'
    ? 'Whole Studio'
    : 'Studio Slot';
  const priceAmount = Number(booking.booking_price || 0);

  return {
    id: String(booking.id),
    type: bookingType,
    bookingType: normalizedBookingType,
    rawDate: booking.booking_date || '',
    rawTime: booking.booking_time || '',
    date: formatDate(booking.booking_date),
    time: formatTime(booking.booking_time),
    status: normalizeStatus(booking.booking_status),
    price: `PHP ${priceAmount.toLocaleString()}`,
    priceAmount,
    provider: booking.booking_addons?.length
      ? booking.booking_addons
          .map(formatBookingAddon)
          .join(', ')
      : booking.providers?.full_name,
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
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [policyPaymentBooking, setPolicyPaymentBooking] = useState<HistoryBooking | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<HistoryBooking | null>(null);
  const [addonModal, setAddonModal] = useState<HistoryBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(formatLocalDate(new Date()));
  const [rescheduleSlots, setRescheduleSlots] = useState<TimeSlot[]>([]);
  const [selectedRescheduleSlotId, setSelectedRescheduleSlotId] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

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

  const getBookingTypeQueryValue = (booking: HistoryBooking) => (
    booking.bookingType === 'whole_studio' ? 'studio' : 'professional'
  );

  const parseDisplayTimeToDatabaseTime = (value: string) => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return value;

    let hours = Number(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;

    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
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
    } catch {
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
    const paymentBookingId = params.get('bookingId');

    const resumeBookingAfterPaymentReturn = async () => {
      const pendingDraft = getPendingPaymentBooking();
      const bookingId = paymentBookingId ?? pendingDraft?.bookingId;

      if (!bookingId) {
        showToast('Payment returned, but the booking reference is missing.', 'error');
        return;
      }

      try {
        await loadBookings(true);
        showToast('Payment returned. Waiting for PayMongo confirmation...', 'info');
      } catch {
        showToast('Payment returned, but we could not refresh your booking yet.', 'error');
      }
    };

    if (payment === 'success') {
      resumeBookingAfterPaymentReturn();
      const cleanedUrl = new URL(window.location.href);
      cleanedUrl.searchParams.delete('payment');
      window.history.replaceState({}, '', cleanedUrl.toString());
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } catch {
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
    if (booking.status !== 'pending' && booking.status !== 'paid') {
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
    } catch {
      showToast('Unable to cancel booking right now. Please try again.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayPendingBooking = async (booking: HistoryBooking) => {
    setPolicyPaymentBooking(null);
    const paymentWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;

    if (!paymentWindow) {
      showToast('Please allow pop-ups so PayMongo checkout can open in a new tab.', 'error');
      return;
    }

    try {
      setPayingBookingId(booking.id);
      const successUrl = `${window.location.origin}/pages/bookings?payment=success&bookingId=${encodeURIComponent(booking.id)}`;
      const paymentLink = await paymongoService.createPaymentLink({
        booking_id: booking.id,
        amount: booking.priceAmount,
        currency: 'PHP',
        description: `Sceneo Studio booking ${booking.rawDate} ${booking.rawTime}`,
        return_url: successUrl,
      });

      const checkoutUrl = paymentLink.checkout_url || paymentLink.attributes?.checkout_url;
      if (!checkoutUrl) {
        paymentWindow.close();
        showToast('Unable to open QRPH payment link. Please try again.', 'error');
        return;
      }

      setPendingPaymentBooking({
        bookingId: booking.id,
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: checkoutUrl,
        createdAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));

      paymentWindow.location.href = checkoutUrl;
      paymentWindow.focus();
      showToast('Payment link opened in a new tab.', 'success');
    } catch (error) {
      paymentWindow.close();
      showToast(error instanceof Error ? error.message : 'Unable to create payment link.', 'error');
    } finally {
      setPayingBookingId(null);
    }
  };

  const openRescheduleModal = (booking: HistoryBooking) => {
    if (isPastBooking(booking)) {
      showToast('This booking has already passed and can no longer be rescheduled.', 'error');
      return;
    }

    if (isInsideCancellationWindow(booking)) {
      showToast('Rescheduling is not allowed within 3 hours of the booking time.', 'error');
      return;
    }

    setRescheduleModal(booking);
    setRescheduleDate(booking.rawDate || formatLocalDate(new Date()));
    setSelectedRescheduleSlotId('');
  };

  useEffect(() => {
    if (!rescheduleModal || !rescheduleDate) return;

    let cancelled = false;

    const loadRescheduleSlots = async () => {
      try {
        setRescheduleLoading(true);
        setSelectedRescheduleSlotId('');

        const selectedDate = new Date(`${rescheduleDate}T00:00:00`);
        const slots = await getSlotsForDate(rescheduleDate);
        const filteredSlots = filterSlotsByBookingType(slots, getBookingTypeQueryValue(rescheduleModal))
          .filter((slot) => (slot.capacity ?? 0) > 0)
          .filter((slot) => !isSlotTooClose(slot, selectedDate));

        if (!cancelled) {
          setRescheduleSlots(filteredSlots);
        }
      } catch {
        if (!cancelled) {
          setRescheduleSlots([]);
        }
      } finally {
        if (!cancelled) {
          setRescheduleLoading(false);
        }
      }
    };

    loadRescheduleSlots();

    return () => {
      cancelled = true;
    };
  }, [rescheduleDate, rescheduleModal]);

  const confirmRescheduleBooking = async () => {
    if (!rescheduleModal || !selectedRescheduleSlotId) {
      showToast('Please choose a new available time slot.', 'error');
      return;
    }

    const selectedSlot = rescheduleSlots.find((slot) => slot.id === selectedRescheduleSlotId);
    if (!selectedSlot) {
      showToast('Selected time slot is no longer available.', 'error');
      return;
    }

    try {
      setRescheduling(true);
      const nextTime = parseDisplayTimeToDatabaseTime(selectedSlot.startTime);

      await api.put(`/bookings/${rescheduleModal.id}`, {
        booking_date: rescheduleDate,
        booking_time: nextTime,
        booking_type: rescheduleModal.bookingType,
        booking_status: 'paid',
      }, { requiresAuth: true });

      setBookings((prev) => prev.map((booking) => (
        booking.id === rescheduleModal.id
          ? {
              ...booking,
              rawDate: rescheduleDate,
              rawTime: nextTime,
              date: formatDate(rescheduleDate),
              time: formatTime(nextTime),
              status: 'paid',
            }
          : booking
      )));

      setRescheduleModal(null);
      showToast('Booking rescheduled successfully. No new payment needed.', 'success');
    } catch {
      showToast('Unable to reschedule booking right now. Please try again.', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const openAddonSelection = (booking: HistoryBooking, type: 'photographer' | 'editor' | 'makeup_artist') => {
    const params = new URLSearchParams({
      type,
      addonBookingId: booking.id,
      addonBookingStatus: booking.status,
      date: booking.rawDate,
      time: booking.rawTime,
    });

    router.push(`/pages/booking/checkout/select-professional?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#e5e7eb] pt-28">
      <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-lg bg-slate-950 text-white shadow-lg">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Sceneo Studio bookings</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">My Bookings</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">Track upcoming studio sessions, payment status, selected add-ons, and cancellation availability in one place.</p>
            {paymentPolling && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-teal-100">
                  <Sparkles className="h-4 w-4" />
                Checking payment status for your latest booking...
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => loadBookings(true)}
            disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Timeline</p>
              <p className="text-sm text-slate-500">Switch between active schedules and booking history.</p>
            </div>
            <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setTimelineFilter('upcoming')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                timelineFilter === 'upcoming'
                    ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('past')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                timelineFilter === 'past'
                    ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Past
            </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">Loading your bookings...</div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
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
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
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
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Book a Studio
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-teal-500" />
                <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Booking #{booking.id}</p>
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

                  <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-2">
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
                    <p className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <span className="font-semibold">Provider:</span> {booking.provider}
                  </p>
                )}

                {(booking.status === 'pending' || booking.status === 'paid') && !isPastBooking(booking) && (
                  <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="max-w-xl text-xs text-slate-500">
                      Pending bookings can still be paid. Paid bookings may be rescheduled up to 3 hours before booking time without paying again.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setAddonModal(booking)}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:border-slate-950 hover:bg-slate-50"
                        >
                          <Plus className="h-4 w-4" />
                          Add Add-ons
                        </button>
                      )}
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setPolicyPaymentBooking(booking)}
                          disabled={payingBookingId === booking.id}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CreditCard className="h-4 w-4" />
                          {payingBookingId === booking.id ? 'Opening Payment...' : 'Pay Now'}
                        </button>
                      )}
                      {booking.status === 'paid' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setAddonModal(booking)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            Add Add-ons
                          </button>
                          <button
                            type="button"
                            onClick={() => openRescheduleModal(booking)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                          >
                            <CalendarClock className="h-4 w-4" />
                            Reschedule Booking
                          </button>
                        </>
                      )}
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => requestCancelBooking(booking)}
                          className="whitespace-nowrap rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(booking.status === 'pending' || booking.status === 'paid') && isPastBooking(booking) && (
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      This booking has already passed.
                    </p>
                  </div>
                )}
                </div>
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

        {addonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
                  {addonModal.status === 'pending' ? 'Pending booking add-ons' : 'Paid booking add-ons'}
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Add to Booking #{addonModal.id}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {addonModal.status === 'pending'
                    ? 'Choose an add-on type. It will be added to your unpaid booking balance, then paid together with the booking.'
                    : 'Choose an add-on type. Payment is required before the add-on is attached to this paid booking.'}
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => openAddonSelection(addonModal, 'photographer')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-950 hover:bg-white"
                >
                  <p className="font-black text-slate-950">Photographer</p>
                  <p className="mt-1 text-sm text-slate-600">Add photographer coverage for this booking time, with FREE 5 edited photos.</p>
                </button>
                <button
                  type="button"
                  onClick={() => openAddonSelection(addonModal, 'editor')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-950 hover:bg-white"
                >
                  <p className="font-black text-slate-950">Editor</p>
                  <p className="mt-1 text-sm text-slate-600">Choose 10, 20, or 30 edited photos.</p>
                </button>
                <button
                  type="button"
                  onClick={() => openAddonSelection(addonModal, 'makeup_artist')}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-950 hover:bg-white"
                >
                  <p className="font-black text-slate-950">Make-up Artist</p>
                  <p className="mt-1 text-sm text-slate-600">Choose an HMUA package for this booking.</p>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAddonModal(null)}
                className="mt-5 w-full rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {rescheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">No extra payment needed</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Reschedule Booking #{rescheduleModal.id}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Choose a new available time slot for your paid booking. Your payment stays attached to this booking.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Current schedule</p>
                <p className="mt-1 text-sm text-slate-600">{rescheduleModal.date} at {rescheduleModal.time}</p>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">New date</label>
                <input
                  type="date"
                  min={formatLocalDate(new Date())}
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-bold text-slate-700">New time slot</p>
                {rescheduleLoading ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
                    Loading available slots...
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                    No available slots for this date. Please choose another date.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedRescheduleSlotId(slot.id)}
                        className={`rounded-lg border p-3 text-left transition ${
                          selectedRescheduleSlotId === slot.id
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <p className="font-black">{slot.displayTime}</p>
                        <p className={`text-xs ${
                          selectedRescheduleSlotId === slot.id ? 'text-white/75' : 'text-slate-500'
                        }`}>
                          {slot.capacity ?? 0} {(slot.capacity ?? 0) === 1 ? 'slot' : 'slots'} available
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  disabled={rescheduling}
                  className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                >
                  Keep Current Schedule
                </button>
                <button
                  type="button"
                  onClick={confirmRescheduleBooking}
                  disabled={rescheduling || !selectedRescheduleSlotId}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
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

        {policyPaymentBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close studio policy"
              onClick={() => setPolicyPaymentBooking(null)}
            />
            <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Studio Policy</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">Please confirm before payment</h2>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-7 text-slate-700">
                <p>
                  To ensure a comfortable and enjoyable experience for everyone, only guests with a confirmed booking may enter the studio.
                </p>
                <p>
                  This includes companions, children, personal makeup artists, personal photographers, and other accompanying guests.
                  If they wish to enter the studio, a booking is required.
                </p>
                <p>
                  Thank you for your understanding and cooperation as we work to keep Sceneo Studio organized, comfortable, and enjoyable for all our guests.
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPolicyPaymentBooking(null)}
                  className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => handlePayPendingBooking(policyPaymentBooking)}
                  className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                >
                  I Agree, Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}



