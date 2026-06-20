'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem, ServiceAddon, useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/toastContext';
import { clearCheckoutDraft, getCheckoutDraft, setCheckoutDraft } from '@/lib/checkoutDraft';
import { setPendingPaymentBooking } from '@/lib/pendingPaymentBooking';
import { PAYMENT_STORAGE_EVENT } from '@/components/GlobalPaymentMonitor';
import { paymongoService } from '@/network/services/paymongoService';
import { api } from '@/network';
import { CalendarDays, Camera, Palette, PenTool, Receipt, ShieldCheck } from 'lucide-react';

interface PromoValidationResponse {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    discounted_base_price: number;
  };
}

export default function BookingCheckoutPage() {
  const { items, setIsOpen,updateItem } = useCart();
  const { user, fetchUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountedBasePrice: number } | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showStudioEntryPolicyModal, setShowStudioEntryPolicyModal] = useState(false);
  const [acceptedStudioEntryPolicy, setAcceptedStudioEntryPolicy] = useState(false);
  const [pendingProviderRemoval, setPendingProviderRemoval] = useState<{
    itemId: string;
    serviceType?: string;
    providerName: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<'idle' | 'preparing' | 'payment'>('idle');
  const [directBookingItem, setDirectBookingItem] = useState<CartItem | null>(null);

  const normalizePhilippinePhone = (input: string): string | null => {
    const compact = input.normalize('NFKC').replace(/[^\d+]/g, '');
    const digits = compact.replace(/\D/g, '');

    if (/^639\d{9}$/.test(digits)) {
      return `+${digits}`;
    }

    if (/^09\d{9}$/.test(digits)) {
      return `+63${digits.slice(1)}`;
    }

    if (/^9\d{9}$/.test(digits)) {
      return `+63${digits}`;
    }

    return null;
  };

  const formatPhilippinePhoneInput = (input: string): string => {
    const cleaned = input.replace(/[^\d+]/g, '');
    if (!cleaned) return '';

    const digits = cleaned.replace(/\D/g, '');
    if (!digits) return '';

    if (cleaned.startsWith('+')) {
      if (digits.startsWith('63')) {
        return `+63${digits.slice(2, 12)}`;
      }
      if (digits.startsWith('0')) {
        return `+63${digits.slice(1, 11)}`;
      }
      return `+63${digits.slice(0, 10)}`;
    }

    if (digits.startsWith('63')) {
      return `+63${digits.slice(2, 12)}`;
    }
    if (digits.startsWith('0')) {
      return `+63${digits.slice(1, 11)}`;
    }
    if (digits.startsWith('9')) {
      return `+63${digits.slice(0, 10)}`;
    }

    return `+63${digits.slice(0, 10)}`;
  };

  const getCurrentSearchParams = () => {
    if (typeof window === 'undefined') {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  };

  const goToProviderSelection = (type: 'photographer' | 'editor' | 'makeup_artist') => {
    const params = getCurrentSearchParams();
    params.set('type', type);
    router.push(`/pages/booking/checkout/select-professional?${params.toString()}`);
  };

  // Helper function to format date in local timezone as YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const checkoutItems = directBookingItem
    ? [directBookingItem]
    : items.length > 0
    ? [items[0]]
    : [];

  const getItemAddons = (item: CartItem): ServiceAddon[] => {
    if (item.serviceAddons?.length) return item.serviceAddons;
    if (!item.serviceProviderId || !item.serviceType || !item.serviceProviderName) return [];
    return [{
      providerId: item.serviceProviderId,
      serviceType: item.serviceType,
      providerName: item.serviceProviderName,
      providerRate: item.serviceProviderRate ?? 0,
      durationMinutes: item.serviceAddons?.[0]?.durationMinutes,
      startOffsetMinutes: item.serviceAddons?.[0]?.startOffsetMinutes,
    }];
  };

  const getItemBasePrice = (item: CartItem) => parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
  const getItemAddonsTotal = (item: CartItem) =>
    getItemAddons(item).reduce((sum, addon) => sum + (addon.quoteRequired ? 0 : Number(addon.providerRate || 0)), 0);
  const getAddonServiceLabel = (serviceType: string) => {
    if (serviceType === 'photography') return 'Photographer';
    if (serviceType === 'editor') return 'Editor';
    if (serviceType === 'make_up_artist') return 'Make-up Artist';
    if (serviceType === 'make_up_artist_false_lashes') return 'HMUA Add-on';
    if (serviceType === 'make_up_artist_touch_up') return 'HMUA Request';
    if (serviceType === 'make_up_artist_hair_extensions') return 'HMUA Request';
    return serviceType.split('_').join(' ');
  };
  const getItemTotal = (item: CartItem) => getItemBasePrice(item) + getItemAddonsTotal(item);
  const bookingBaseTotal = checkoutItems.reduce((sum, item) => sum + getItemBasePrice(item), 0);
  const bookingAddonsTotal = checkoutItems.reduce((sum, item) => sum + getItemAddonsTotal(item), 0);
  const discountedBaseTotal = appliedPromo ? appliedPromo.discountedBasePrice : bookingBaseTotal;
  const checkoutTotal = discountedBaseTotal + bookingAddonsTotal;

  // Fetch user data on mount and auto-fill form
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated()) {
        try {
          await fetchUser();
        } catch {}
      }
    };
    
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill form when user data is available
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(formatPhilippinePhoneInput(user.phone || ''));
    }
  }, [user]);

  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value.toUpperCase());
    setPromoMessage('');
    setAppliedPromo(null);
  };

  const handleApplyPromoCode = async () => {
    const normalizedPromoCode = promoCode.trim();
    const item = checkoutItems[0];

    if (!item) {
      setPromoMessage('Select a booking slot before applying a promo code.');
      return;
    }

    if (!normalizedPromoCode) {
      setPromoMessage('Enter a promo code.');
      return;
    }

    setPromoApplying(true);
    setPromoMessage('');

    try {
      const response = await api.post<PromoValidationResponse>('/bookings/promo/validate', {
        promo_code: normalizedPromoCode,
        booking_type: item.bookingType || 'professional_slots',
        booking_date: item.bookingDate || formatLocalDate(new Date()),
        booking_base_price: getItemBasePrice(item),
      }, { requiresAuth: true });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Promo code could not be applied.');
      }

      setAppliedPromo({
        code: response.data.code,
        discountedBasePrice: response.data.discounted_base_price,
      });
      setPromoCode(response.data.code);
      setPromoMessage(response.message || 'Promo code applied.');
      showToast('Promo code applied.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Promo code could not be applied.';
      setAppliedPromo(null);
      setPromoMessage(message);
      showToast(message, 'error');
    } finally {
      setPromoApplying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || checkoutItems.length === 0) {
      showToast('Please provide name, email and at least one booking item.', 'error');
      return;
    }

    if (checkoutItems.length > 1) {
      showToast('Please checkout one booking at a time while payment is enabled.', 'error');
      return;
    }

    const normalizedPhone = normalizePhilippinePhone(phone);
    if (!normalizedPhone) {
      showToast('Please enter a valid Philippine mobile number (e.g., 09171234567 or +639171234567).', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('Please read and agree to all Terms & Conditions before payment.', 'error');
      return;
    }
    
    if (!isAuthenticated()) {
      showToast('Please log in to complete your booking.', 'error');
      const nextPath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/pages/booking/checkout';
      router.push(`/pages/Auth/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (!acceptedStudioEntryPolicy) {
      setShowStudioEntryPolicyModal(true);
      return;
    }

    setSubmitting(true);
    setSubmissionStage('preparing');
    const paymentWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;

    if (!paymentWindow) {
      showToast('Please allow pop-ups so PayMongo checkout can open in a new tab.', 'error');
      setSubmitting(false);
      setSubmissionStage('idle');
      return;
    }

    try {
      // Extract UUID from potentially concatenated ID (cart adds timestamp)
      const extractUUID = (id: string): string => {
        // UUID format: 8-4-4-4-12 characters (36 total)
        const uuidMatch = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return uuidMatch ? uuidMatch[0] : id;
      };

      const item = checkoutItems[0];
      const selectedAddons = getItemAddons(item);

      if (selectedAddons.some((addon) => addon.quoteRequired && !addon.requestOnly)) {
        paymentWindow.close();
        showToast('This booking includes a service for quotation. Please wait for admin confirmation before payment.', 'error');
        return;
      }

      const parseTime = (timeStr: string): string => {
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;

        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = match[2];
          const meridiem = match[3].toUpperCase();

          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;

          return `${String(hours).padStart(2, '0')}:${minutes}:00`;
        }

        return '09:00:00';
      };

      const toLocalPhilippinePhone = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        if (/^639\d{9}$/.test(digits)) {
          return `0${digits.slice(2)}`;
        }
        if (/^09\d{9}$/.test(digits)) {
          return digits;
        }
        return value;
      };

      const normalizeServiceType = (serviceType?: string): string | null => {
        if (!serviceType) return null;
        if (serviceType === 'photography') return 'photo';
        if (serviceType === 'make_up_artist') return 'makeup_artist';
        return serviceType;
      };

      const bookingPrice = checkoutTotal;
      const primaryAddon = selectedAddons[0];

      const fallbackTimeSlotId = item.timeSlotId || extractUUID(item.id);
      if (!fallbackTimeSlotId) {
        showToast('Please select a valid booking slot before payment.', 'error');
        return;
      }

      setSubmissionStage('payment');
      type CreatedBookingResponse = {
        id?: number | string;
        booking_id?: number | string;
        bookingId?: number | string;
        data?: unknown;
      };

      const getBookingIdFromResponse = (response: unknown): string | undefined => {
        if (!response || typeof response !== 'object') return undefined;

        const record = response as CreatedBookingResponse;
        const candidate = record.id ?? record.booking_id ?? record.bookingId;
        if (candidate != null && candidate !== '') {
          return String(candidate);
        }

        if (record.data) {
          return getBookingIdFromResponse(record.data);
        }

        return undefined;
      };

      const pendingBookingPayload = {
        user_id: user?.id || 0,
        customer_name: name,
        customer_email: email,
        customer_phone: toLocalPhilippinePhone(normalizedPhone),
        booking_type: (item.bookingType === 'whole_studio' ? 'whole_studio' : 'professional_slots') as 'whole_studio' | 'professional_slots',
        booking_date: item.bookingDate || formatLocalDate(new Date()),
        booking_time: parseTime(item.time),
        booking_status: 'pending' as const,
        booking_price: bookingPrice,
        service_type: normalizeServiceType(primaryAddon?.serviceType || item.serviceType),
        service_provider_id: primaryAddon?.providerId ?? item.serviceProviderId ?? null,
        time_slot_id: fallbackTimeSlotId,
        promo_code: appliedPromo?.code || undefined,
        addons: selectedAddons.map((addon) => ({
          provider_id: addon.providerId,
          service_type: addon.serviceType,
          provider_name_snapshot: addon.providerName,
          provider_rate_snapshot: addon.quoteRequired ? 0 : addon.providerRate,
          quote_required: Boolean(addon.quoteRequired),
          duration_minutes: addon.durationMinutes || null,
          start_offset_minutes: addon.startOffsetMinutes ?? null,
        })),
      };

      const createdBooking = await api.post<CreatedBookingResponse>('/bookings', pendingBookingPayload, { requiresAuth: true });
      const bookingIdCandidate = getBookingIdFromResponse(createdBooking);

      if (!bookingIdCandidate) {
        paymentWindow.close();
        showToast('Unable to determine booking ID before payment. Please try again.', 'error');
        return;
      }

      const amount = checkoutTotal;
      const description = `Sceneo Studio booking ${pendingBookingPayload.booking_date} ${pendingBookingPayload.booking_time}`;
      const successUrl = `${window.location.origin}/pages/bookings?payment=success&bookingId=${encodeURIComponent(String(bookingIdCandidate))}`;
      const paymentLink = await paymongoService.createPaymentLink({
        booking_id: bookingIdCandidate,
        amount,
        currency: 'PHP',
        description,
        return_url: successUrl,
      });

      const checkoutUrl = paymentLink?.checkout_url || paymentLink?.attributes?.checkout_url;
      if (!checkoutUrl) {
        paymentWindow.close();
        showToast('Unable to open QRPH payment link. Please try again.', 'error');
        return;
      }

      setPendingPaymentBooking({
        bookingId: String(bookingIdCandidate),
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: checkoutUrl,
        cartItemId: item.id,
        createdAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
      clearCheckoutDraft();
      setIsOpen(false);

      paymentWindow.location.href = checkoutUrl;
      paymentWindow.focus();
      return;
    } catch (error) {
      paymentWindow.close();
      const message = error instanceof Error ? error.message : 'An error occurred while creating your booking. Please try again.';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
      setSubmissionStage('idle');
    }
  };

  const confirmStudioEntryPolicy = () => {
    setAcceptedStudioEntryPolicy(true);
    setShowStudioEntryPolicyModal(false);
    window.setTimeout(() => {
      const form = document.getElementById('bookingForm') as HTMLFormElement | null;
      form?.requestSubmit();
    }, 0);
  };

  useEffect(() => {
    const searchParams = getCurrentSearchParams();
    const studioId = searchParams.get('studioId');
    if (!studioId) {
      setDirectBookingItem(getCheckoutDraft());
      return;
    }

    const date = searchParams.get('date') || formatLocalDate(new Date());
    const time = searchParams.get('time') || '';
    const name = searchParams.get('name') || 'Studio Booking';
    const price = searchParams.get('price') || '₱0';
    const duration = searchParams.get('duration') || '';
    const timeSlotId = searchParams.get('timeSlotId') || studioId;
    const bookingTypeParam = searchParams.get('bookingType') || 'professional_slots';
    const bookingType = (bookingTypeParam === 'whole_studio' || bookingTypeParam === 'professional_slots') 
      ? bookingTypeParam 
      : 'professional_slots';

    const providerIdParam = searchParams.get('provider_id');
    const providerTypeParam = searchParams.get('provider_type');
    const providerNameParam = searchParams.get('provider_name');
    const parsedProviderId = providerIdParam ? Number(providerIdParam) : undefined;
    const providerRateParam = searchParams.get('provider_rate');
    const providerQuoteRequiredParam = searchParams.get('provider_quote_required') === 'true';
    const providerDurationParam = searchParams.get('provider_duration_minutes');
    const parsedProviderDuration = providerDurationParam ? Number(providerDurationParam) : undefined;
    const validProviderDuration = Number.isFinite(parsedProviderDuration) ? parsedProviderDuration : undefined;
    const providerStartOffsetParam = searchParams.get('provider_start_offset_minutes');
    const parsedProviderStartOffset = providerStartOffsetParam ? Number(providerStartOffsetParam) : undefined;
    const validProviderStartOffset = Number.isFinite(parsedProviderStartOffset) ? parsedProviderStartOffset : undefined;
    const validProviderId = Number.isFinite(parsedProviderId) ? parsedProviderId : undefined;
    const serviceAddons = validProviderId && providerTypeParam && providerNameParam
      ? [{
          providerId: validProviderId,
          serviceType: providerTypeParam,
          providerName: providerNameParam,
          providerRate: providerRateParam ? Number(providerRateParam) : 0,
          quoteRequired: providerQuoteRequiredParam,
          durationMinutes: validProviderDuration,
          startOffsetMinutes: validProviderStartOffset,
        }]
      : undefined;

    const directItem: CartItem = {
      id: `direct-${studioId}-${date}`,
      time,
      name,
      price,
      duration,
      bookingDate: date,
      timeSlotId,
      bookingType,
      serviceProviderId: validProviderId,
      serviceType: providerTypeParam || undefined,
      serviceProviderName: providerNameParam || undefined,
      serviceProviderRate: providerRateParam ? Number(providerRateParam) : undefined,
      serviceAddons,
    };

    setDirectBookingItem(directItem);
    setCheckoutDraft(directItem);
  }, []);
  const requestRemoveProvider = (itemId: string, addon: ServiceAddon) => {
    setPendingProviderRemoval({
      itemId,
      serviceType: addon.serviceType,
      providerName: addon.providerName,
    });
  };

  const handleRemoveProvider = (itemId: string, serviceType?: string) => {
  const updatedItem = checkoutItems.find(it => it.id === itemId);
  if (!updatedItem) return;

  const remainingAddons = serviceType
    ? getItemAddons(updatedItem).filter((addon) => (
        serviceType === 'make_up_artist'
          ? !addon.serviceType.startsWith('make_up_artist')
          : addon.serviceType !== serviceType
      ))
    : [];
  const firstAddon = remainingAddons[0];

  const cleaned: CartItem = {
    ...updatedItem,
    serviceProviderId: firstAddon?.providerId,
    serviceType: firstAddon?.serviceType,
    serviceProviderName: firstAddon?.providerName,
    serviceProviderRate: firstAddon?.providerRate,
    serviceAddons: remainingAddons,
  };

  // If it came from the cart, update cart items
  if (items.length > 0) {
    // You'll need updateItem from your cart context — see note below
    updateItem(cleaned);
  } else {
    // Direct booking / draft flow
    setDirectBookingItem(cleaned);
    setCheckoutDraft(cleaned);
  }

  showToast('Service provider removed.', 'info');
  setPendingProviderRemoval(null);
};

  return (
    <main className="min-h-screen bg-[#e5e7eb] py-8 pt-28 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-700">Sceneo Studio Checkout</p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">Complete Your Booking</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Review your booking, add creative support, and continue to secure QRPH payment.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left - Client Details (span 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Details Card */}
            <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Step 1</p>
                  <h2 className="text-2xl font-black text-slate-950">Client Details</h2>
                </div>
              </div>

              <form id="bookingForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Full Name *</div>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-colors focus:border-slate-950 focus:bg-white focus:ring-0" 
                      placeholder="John Doe" 
                      required 
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Email Address *</div>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-colors focus:border-slate-950 focus:bg-white focus:ring-0" 
                      placeholder="john@example.com" 
                      required 
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Phone Number *</div>
                  <input 
                    value={phone} 
                    onChange={(e) => setPhone(formatPhilippinePhoneInput(e.target.value))} 
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition-colors focus:border-slate-950 focus:bg-white focus:ring-0" 
                    placeholder="09171234567 or +639171234567"
                    required
                    pattern="^\+639\d{9}$"
                    title="Enter a valid Philippine mobile number (09171234567 or +639171234567)."
                    maxLength={13}
                  />
                  <p className="text-xs text-gray-500 mt-1">Philippine mobile format only</p>
                </label>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Payment Method</div>
                  <div className="rounded-lg border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                    QRPH
                  </div>
                  <p className="text-xs text-gray-500">Other payment options are temporarily unavailable.</p>
                </div>

                {/* Terms and Conditions */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                      required
                    />
                    <span className="text-sm leading-relaxed text-slate-700">
                      I have read, understood, and agree to the{' '}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          setShowPolicyModal(true);
                        }}
                        className="font-bold text-rose-700 underline hover:text-rose-800"
                      >
                        Terms & Policies
                      </button>
                      .
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Add-on Services Card */}
            <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                  <Camera size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Step 2</p>
                  <h2 className="text-2xl font-black text-slate-950">Add-on Services</h2>
                  <p className="text-sm text-slate-600">Enhance your studio experience with professional add-ons.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => goToProviderSelection('photographer')}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-slate-950 hover:bg-white hover:shadow-md"
                >
                  <div className="hidden" aria-hidden="true">icon</div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Camera size={22} />
                  </div>
                  <h3 className="mb-1 font-black text-slate-950">Photographer</h3>
                  <p className="text-sm text-slate-600">Choose an available photographer for your schedule, with FREE 5 edited photos.</p>
                </button>
                <button
                  type="button"
                  onClick={() => goToProviderSelection('editor')}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-slate-950 hover:bg-white hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                    <PenTool size={22} />
                  </div>
                  <h3 className="mb-1 font-black text-slate-950">Editor</h3>
                  <p className="text-sm text-slate-600">Add an editor for photo editing and retouching.</p>
                </button>
                <button
                  type="button"
                  onClick={() => goToProviderSelection('makeup_artist')}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-slate-950 hover:bg-white hover:shadow-md"
                >
                  <div className="hidden" aria-hidden="true">icon</div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
                    <Palette size={22} />
                  </div>
                  <h3 className="mb-1 font-black text-slate-950">Make-up Artist</h3>
                  <p className="text-sm text-slate-600">Add a make-up artist matched to your booking time.</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right - Booking Summary */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="bg-slate-950 rounded-lg p-6 sm:p-8 text-white shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-950">
                  <Receipt size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Step 3</p>
                  <h2 className="text-2xl font-black">Booking Summary</h2>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {checkoutItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-white/60">
                      <CalendarDays size={26} />
                    </div>
                    <p className="text-gray-400">No bookings yet</p>
                  </div>
                ) : (
                  checkoutItems.map((it) => (
                    <div key={it.id} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
      <CalendarDays size={20} />
    </div>
    <div className="flex-grow min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-white text-sm leading-tight">{it.name}</div>
        <div className="font-bold text-white text-sm flex-shrink-0">{it.price}</div>
      </div>
      <div className="text-sm text-gray-300 mt-1">{it.time} / {it.duration}</div>
      <div className="text-sm text-gray-400 mt-1">
        {it.bookingDate ? new Date(it.bookingDate + 'T00:00:00').toLocaleDateString() : 'No date selected'}
      </div>
      {getItemAddons(it).map((addon) => (
        <div key={`${addon.serviceType}-${addon.providerId}`} className="mt-2 pt-2 border-t border-white/10 flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-gray-400">
              {getAddonServiceLabel(addon.serviceType)}
            </div>
            <div className="text-sm text-gray-200">
              {addon.providerName}
              {addon.durationMinutes ? (
                <span className="text-gray-400">
                  {' - '}
                  {addon.durationMinutes === 30 && addon.startOffsetMinutes === 0
                    ? 'First 30 mins'
                    : addon.durationMinutes === 30 && addon.startOffsetMinutes === 30
                      ? 'Last 30 mins'
                      : `${addon.durationMinutes} min`}
                </span>
              ) : null}
              <span className="text-gray-400"> - {addon.requestOnly ? 'Available on request' : addon.quoteRequired ? 'For quotation' : `PHP ${Number(addon.providerRate).toLocaleString()}`}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requestRemoveProvider(it.id, addon)}
            className="text-xs text-red-400 hover:text-red-300 underline whitespace-nowrap flex-shrink-0 mt-1"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  </div>
</div>
                  ))
                )}
              </div>

              {checkoutItems.length > 0 && (
  <>
    <div className="hidden">
      <div className="flex justify-between text-gray-300">
        <span>Booking Fee</span>
        <span>
          ₱{checkoutItems.reduce((sum, it) => {
            return sum + parseFloat(it.price.replace(/[^0-9.]/g, ''));
          }, 0).toFixed(2)}
        </span>
      </div>

      {checkoutItems.some(it => it.serviceProviderRate) && (
        <div className="flex justify-between text-gray-300">
          <span>Provider Rate</span>
          <span>
            ₱{checkoutItems.reduce((sum, it) => {
              return sum + (it.serviceProviderRate ?? 0);
            }, 0).toFixed(2)}
          </span>
        </div>
      )}

      <div className="flex justify-between text-2xl font-bold text-white pt-2 border-t border-white/20">
        <span>Total</span>
        <span>
          ₱{checkoutItems.reduce((sum, it) => {
            const bookingFee = parseFloat(it.price.replace(/[^0-9.]/g, ''));
            const providerRate = it.serviceProviderRate ?? 0;
            return sum + bookingFee + providerRate;
          }, 0).toFixed(2)}
        </span>
      </div>
    </div>

    <div className="border-t border-white/20 pt-4 space-y-3">
      <div className="rounded-lg border border-white/15 bg-white/10 p-4">
        <label className="mb-2 block text-sm font-bold text-white">Grand Opening Promo Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(event) => handlePromoCodeChange(event.target.value)}
            placeholder="Enter code"
            disabled={promoApplying || submitting}
            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white px-3 py-2 text-sm font-bold uppercase text-slate-950 placeholder:text-slate-400 focus:border-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyPromoCode}
            disabled={promoApplying || submitting || !promoCode.trim()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-black text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {promoApplying ? 'Checking...' : appliedPromo ? 'Applied' : 'Apply'}
          </button>
        </div>
        {promoMessage && (
          <p className={`mt-2 text-xs font-semibold ${appliedPromo ? 'text-green-300' : 'text-rose-300'}`}>
            {promoMessage}
          </p>
        )}
      </div>

      <div className="flex justify-between text-gray-300">
        <span>Booking Fee</span>
        <span className={appliedPromo ? 'line-through opacity-70' : ''}>PHP {bookingBaseTotal.toFixed(2)}</span>
      </div>

      {appliedPromo && (
        <div className="flex justify-between text-green-300">
          <span>Promo Fee ({appliedPromo.code})</span>
          <span>PHP {discountedBaseTotal.toFixed(2)}</span>
        </div>
      )}

      {appliedPromo && (
        <div className="flex justify-between text-green-300">
          <span>Promo Savings</span>
          <span>- PHP {Math.max(0, bookingBaseTotal - discountedBaseTotal).toFixed(2)}</span>
        </div>
      )}

      {checkoutItems.some(it => getItemAddons(it).length > 0) && (
        <div className="flex justify-between text-gray-300">
          <span>Add-ons</span>
          <span>PHP {bookingAddonsTotal.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between text-2xl font-bold text-white pt-2 border-t border-white/20">
        <span>Total</span>
        <span>PHP {checkoutTotal.toFixed(2)}</span>
      </div>

      <div className="hidden">
      {checkoutItems.some(it => getItemAddons(it).length > 0) && (
        <div className="flex justify-between text-gray-300">
          <span>Add-ons</span>
          <span>PHP {checkoutItems.reduce((sum, it) => sum + getItemAddonsTotal(it), 0).toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between text-2xl font-bold text-white pt-2 border-t border-white/20">
        <span>Total</span>
        <span>PHP {checkoutItems.reduce((sum, it) => sum + getItemTotal(it), 0).toFixed(2)}</span>
      </div>
      </div>
    </div>

    <button
      form="bookingForm"
      type="submit"
      disabled={submitting || !acceptedTerms}
      className={`w-full mt-6 bg-white text-black px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
        submitting || !acceptedTerms ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100 transform hover:scale-105 active:scale-95'
      }`}
    >
      {submitting
        ? submissionStage === 'payment'
          ? 'Opening PayMongo checkout...'
          : 'Preparing Payment...'
        : 'Proceed to Payment'}
    </button>

    <p className="mt-4 text-xs text-gray-400 text-center">
      Payment is available after you agree to the Terms & Policies.
    </p>
  </>
)}
            </div>
          </aside>
        </div>
      </div>

      {pendingProviderRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close remove confirmation"
            onClick={() => setPendingProviderRemoval(null)}
          />
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-950">Remove this add-on?</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {pendingProviderRemoval.providerName} will be removed from this booking.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingProviderRemoval(null)}
                className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200"
              >
                Keep Add-on
              </button>
              <button
                type="button"
                onClick={() => handleRemoveProvider(pendingProviderRemoval.itemId, pendingProviderRemoval.serviceType)}
                className="rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-red-700"
              >
                Remove Add-on
              </button>
            </div>
          </div>
        </div>
      )}

      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPolicyModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close policy modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-gray-700">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-gray-900 mb-2">Shared Studio Experience</h3>
                <p>
                  I understand that Sceneo Studio is a shared space and multiple bookings may occur during the same time slot. Access to specific curated scenes, backdrops, and props is subject to availability and cannot be guaranteed, as they may be occupied by other guests. I agree to be respectful and considerate of fellow guests and to handle all studio facilities and equipment with care.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-gray-900 mb-2">Booking, Rescheduling, and Refund Policy</h3>
                <p>
                  I understand that Soft Opening rates are promotional and heavily discounted. All bookings are strictly non-refundable and non-cancellable. However, I may request to reschedule my session up to three (3) hours before my scheduled time, subject to availability, for a maximum of three (3) rebookings per reservation. Failure to appear or to request rescheduling at least three (3) hours before the session shall result in forfeiture of the booking and all payments made.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-gray-900 mb-2">Studio Policies and Acknowledgment</h3>
                <p>
                  I agree to complete my session within my reserved time slot. Additional time is subject to availability and corresponding fees. Sceneo Studio reserves the right to refuse service, terminate a session without refund, or charge for any damages resulting from inappropriate, unsafe, disruptive behavior, or negligence. By proceeding with this booking, I acknowledge that I have read, understood, and agreed to these Terms & Conditions.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showStudioEntryPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close studio policy"
            onClick={() => setShowStudioEntryPolicyModal(false)}
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
                onClick={() => setShowStudioEntryPolicyModal(false)}
                className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmStudioEntryPolicy}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
              >
                I Agree, Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



