'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, CheckCircle2, Clock3, Images, Loader2, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/toastContext';
import studioPackageService, { PackageAvailability, StudioPackage } from '@/network/services/studioPackageService';
import { paymongoService } from '@/network/services/paymongoService';
import { setPendingPaymentBooking } from '@/lib/pendingPaymentBooking';
import { PAYMENT_STORAGE_EVENT } from '@/components/GlobalPaymentMonitor';
import MakeupAddonSelector from '@/components/MakeupAddonSelector';
import { ServiceAddon } from '@/lib/cartContext';
import { api } from '@/network';

interface PromoValidationResponse {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    discounted_total_price: number;
    discounted_base_price?: number;
  };
}

const getBookingId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { id?: number | string; data?: unknown };
  if (record.id != null) return String(record.id);
  return record.data ? getBookingId(record.data) : null;
};

const getCompanionPolicy = (audienceKey: string) => {
  if (audienceKey === 'solo') return '1 companion allowed; additional companions need their own slot';
  if (audienceKey === 'couple') return '1 extra companion allowed; additional companions need their own slot';
  return 'No extra companions; companions need their own slot';
};

function PackageCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const packageId = Number(searchParams.get('packageId'));
  const bookingDate = searchParams.get('date') || '';
  const slotIdsKey = searchParams.get('slotIds') || '';
  const slotIds = useMemo(() => slotIdsKey.split(',').filter(Boolean), [slotIdsKey]);
  const [studioPackage, setStudioPackage] = useState<StudioPackage | null>(null);
  const [schedule, setSchedule] = useState<PackageAvailability | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [makeupAddons, setMakeupAddons] = useState<ServiceAddon[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountedTotalPrice: number } | null>(null);

  const makeupTotal = makeupAddons.reduce((sum, addon) => sum + (addon.quoteRequired ? 0 : Number(addon.providerRate || 0)), 0);
  const checkoutSubtotal = Number(studioPackage?.package_price || 0) + makeupTotal;
  const checkoutTotal = appliedPromo ? appliedPromo.discountedTotalPrice : checkoutSubtotal;

  const handleMakeupAddonsChange = (addons: ServiceAddon[]) => {
    setMakeupAddons(addons);
    if (appliedPromo) {
      setAppliedPromo(null);
      setPromoMessage('Add-ons changed. Apply the promo code again to recalculate the total.');
    }
  };

  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value.toUpperCase());
    setAppliedPromo(null);
    setPromoMessage('');
  };

  const handleApplyPromoCode = async () => {
    const normalizedCode = promoCode.trim();
    if (!normalizedCode || !studioPackage) {
      setPromoMessage('Enter a promo code.');
      return;
    }
    if (!isAuthenticated()) {
      const next = `/pages/packages/checkout?${searchParams.toString()}`;
      router.push(`/pages/Auth/login?next=${encodeURIComponent(next)}`);
      return;
    }

    setPromoApplying(true);
    setPromoMessage('');
    try {
      const response = await api.post<PromoValidationResponse>('/bookings/promo/validate', {
        promo_code: normalizedCode,
        booking_type: 'professional_slots',
        booking_date: bookingDate,
        booking_total_price: checkoutSubtotal,
      }, { requiresAuth: true });
      if (!response.success || !response.data) throw new Error(response.message || 'Promo code could not be applied.');

      setAppliedPromo({
        code: response.data.code,
        discountedTotalPrice: response.data.discounted_total_price ?? response.data.discounted_base_price ?? 0,
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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    Promise.all([studioPackageService.list(), studioPackageService.availability(packageId, bookingDate)])
      .then(([packages, times]) => {
        const selectedPackage = packages.find((item) => item.id === packageId) || null;
        const selectedSchedule = times.find((item) => item.time_slot_ids.join(',') === slotIds.join(',')) || null;
        setStudioPackage(selectedPackage);
        setSchedule(selectedSchedule);
      })
      .finally(() => setLoading(false));
  }, [packageId, bookingDate, slotIds]);

  const handlePayment = async () => {
    if (!studioPackage || !schedule || !name.trim() || !email.trim() || !phone.trim()) {
      showToast('Complete your customer details and select an available schedule.', 'error');
      return;
    }
    if (!accepted) {
      showToast('Please agree to the booking terms and studio policy.', 'error');
      return;
    }
    if (!isAuthenticated()) {
      const next = `/pages/packages/checkout?${searchParams.toString()}`;
      router.push(`/pages/Auth/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const requiresPaymongoPayment = checkoutTotal > 0;
    const paymentWindow = requiresPaymongoPayment ? window.open('', '_blank') : null;
    if (requiresPaymongoPayment && !paymentWindow) {
      showToast('Please allow pop-ups so PayMongo can open in a new tab.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await studioPackageService.book({
        package_id: studioPackage.id,
        booking_date: bookingDate,
        time_slot_ids: schedule.time_slot_ids,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        addons: makeupAddons,
        promo_code: appliedPromo?.code,
      });
      const bookingId = getBookingId(response);
      if (!bookingId) throw new Error('Unable to determine the package booking ID.');

      if (!requiresPaymongoPayment) {
        showToast('Promo applied. Your package booking is confirmed with no payment required.', 'success');
        router.push(`/pages/bookings?payment=success&bookingId=${encodeURIComponent(bookingId)}`);
        return;
      }

      const returnUrl = `${window.location.origin}/pages/bookings?payment=success&bookingId=${encodeURIComponent(bookingId)}`;
      const link = await paymongoService.createPaymentLink({
        booking_id: bookingId,
        booking_ids: [bookingId],
        amount: checkoutTotal,
        currency: 'PHP',
        description: `${studioPackage.name} on ${bookingDate}, ${schedule.display_time}`,
        return_url: returnUrl,
      });
      const checkoutUrl = link.checkout_url || link.attributes?.checkout_url;
      if (!checkoutUrl) throw new Error('PayMongo did not return a checkout URL.');

      setPendingPaymentBooking({ paymentType: 'package', bookingId, bookingIds: [bookingId], paymentLinkId: link.id, paymentLinkUrl: checkoutUrl, createdAt: new Date().toISOString() });
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
      paymentWindow!.location.href = checkoutUrl;
      paymentWindow!.focus();
    } catch (error) {
      paymentWindow?.close();
      showToast(error instanceof Error ? error.message : 'Unable to create the package booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="flex min-h-[70vh] items-center justify-center bg-[#e5e7eb]"><Loader2 className="animate-spin" /></main>;
  if (!studioPackage || !schedule) return <main className="min-h-[70vh] bg-[#e5e7eb] p-8 text-center"><h1 className="text-2xl font-black">This package schedule is no longer available.</h1><button onClick={() => router.push('/pages/packages')} className="mt-5 rounded-lg bg-slate-950 px-5 py-3 font-bold text-white">Choose another schedule</button></main>;

  return (
    <main className="min-h-screen bg-[#e5e7eb] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_380px]">
        <section className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Package Checkout</p>
          <h1 className="mt-2 text-3xl font-black">Complete your package booking</h1>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950" /></label>
            <label className="text-sm font-bold text-slate-700">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950" /></label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-950" /></label>
          </div>

          {studioPackage.makeup_available && (
            <MakeupAddonSelector bookingDate={bookingDate} bookingTime={schedule.start_time} value={makeupAddons} onChange={handleMakeupAddonsChange} />
          )}

          <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex gap-3"><ShieldCheck className="shrink-0 text-teal-700" /><div><h2 className="font-black">Booking acknowledgement</h2><p className="mt-1 text-sm leading-6 text-slate-600">Only guests covered by this confirmed package may enter the studio. Sessions start and end as scheduled. Package bookings remain subject to Sceneo Studio&apos;s rescheduling, refund, and shared-studio policies.</p></div></div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-700"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" /> I have read and agree to the Terms & Policies and studio entry policy.</label>
          </div>
        </section>

        <aside className="h-fit rounded-lg bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{studioPackage.audience_name} · Bundle {studioPackage.bundle_code}</p>
          <h2 className="mt-2 text-2xl font-black">{studioPackage.name}</h2>
          <p className="mt-2 text-sm text-slate-400">{bookingDate} · {schedule.display_time}</p>
          <div className="my-5 border-t border-white/15" />
          <div className="space-y-3 text-sm text-slate-300">
            <p className="flex gap-2"><Users size={17} /> {studioPackage.slot_quantity} {studioPackage.slot_quantity === 1 ? 'guest' : 'guests'}</p>
            <p className="flex gap-2"><Clock3 size={17} /> {studioPackage.access_minutes / 60} {studioPackage.access_minutes === 60 ? 'hour' : 'hours'} studio access</p>
            {studioPackage.photography_minutes > 0 && <p className="flex gap-2"><Camera size={17} /> {studioPackage.photography_minutes} mins with in-house pro photographer</p>}
            {studioPackage.edited_photos > 0 && <p className="flex gap-2"><Images size={17} /> {studioPackage.edited_photos} edited photos</p>}
            <p className="flex gap-2"><Users size={17} /> {getCompanionPolicy(studioPackage.audience_key)}</p>
            <p className="flex gap-2"><CheckCircle2 size={17} /> Access to all curated sets</p>
          </div>
          <div className="my-5 border-t border-white/15" />
          <div className="mb-5 rounded-lg border border-white/15 bg-white/5 p-4">
            <label className="mb-2 block text-sm font-bold text-white">Promo Code</label>
            <div className="flex gap-2">
              <input type="text" value={promoCode} onChange={(event) => handlePromoCodeChange(event.target.value)} placeholder="Enter code" disabled={promoApplying || submitting} className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-sm font-bold uppercase text-slate-950 outline-none" />
              <button type="button" onClick={handleApplyPromoCode} disabled={promoApplying || submitting || !promoCode.trim()} className="rounded-lg bg-white px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-60">{promoApplying ? 'Checking...' : appliedPromo ? 'Applied' : 'Apply'}</button>
            </div>
            {promoMessage && <p className={`mt-2 text-xs font-semibold ${appliedPromo ? 'text-green-300' : 'text-amber-200'}`}>{promoMessage}</p>}
          </div>
          <div className="mb-3 flex justify-between text-sm text-slate-300"><span>Package</span><span className={appliedPromo ? 'line-through opacity-60' : ''}>PHP {Number(studioPackage.package_price).toLocaleString()}</span></div>
          {makeupAddons.length > 0 && <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-300"><span>Make-up add-on</span><div className="flex items-center gap-3"><span className={appliedPromo ? 'line-through opacity-60' : ''}>PHP {makeupTotal.toLocaleString()}</span><button type="button" onClick={() => handleMakeupAddonsChange([])} aria-label="Remove make-up add-on" title="Remove make-up add-on" className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><Trash2 size={16} /></button></div></div>}
          {appliedPromo && <div className="mb-3 flex justify-between text-sm font-bold text-green-300"><span>Promo savings ({appliedPromo.code})</span><span>- PHP {Math.max(0, checkoutSubtotal - checkoutTotal).toLocaleString()}</span></div>}
          <div className="flex items-end justify-between border-t border-white/15 pt-4"><span>Total</span><span className="text-3xl font-black">PHP {checkoutTotal.toLocaleString()}</span></div>
          <button disabled={submitting} onClick={handlePayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 font-black text-slate-950 hover:bg-teal-200 disabled:opacity-50">{submitting && <Loader2 size={18} className="animate-spin" />}{submitting ? 'Preparing Payment' : 'Proceed to Payment'}</button>
        </aside>
      </div>
    </main>
  );
}

export default function PackageCheckoutPage() {
  return (
    <Suspense fallback={<main className="flex min-h-[70vh] items-center justify-center bg-[#e5e7eb]"><Loader2 className="animate-spin" /></main>}>
      <PackageCheckoutContent />
    </Suspense>
  );
}
