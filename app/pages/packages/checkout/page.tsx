'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, CheckCircle2, Clock3, Images, Loader2, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/toastContext';
import studioPackageService, { PackageAvailability, StudioPackage } from '@/network/services/studioPackageService';
import { paymongoService } from '@/network/services/paymongoService';
import { setPendingPaymentBooking } from '@/lib/pendingPaymentBooking';
import { PAYMENT_STORAGE_EVENT } from '@/components/GlobalPaymentMonitor';

const getBookingId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { id?: number | string; data?: unknown };
  if (record.id != null) return String(record.id);
  return record.data ? getBookingId(record.data) : null;
};

function PackageCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const packageId = Number(searchParams.get('packageId'));
  const bookingDate = searchParams.get('date') || '';
  const slotIds = (searchParams.get('slotIds') || '').split(',').filter(Boolean);
  const [studioPackage, setStudioPackage] = useState<StudioPackage | null>(null);
  const [schedule, setSchedule] = useState<PackageAvailability | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
  }, [packageId, bookingDate, searchParams]);

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

    const paymentWindow = window.open('', '_blank');
    if (!paymentWindow) {
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
      });
      const bookingId = getBookingId(response);
      if (!bookingId) throw new Error('Unable to determine the package booking ID.');

      const returnUrl = `${window.location.origin}/pages/bookings?payment=success&bookingId=${encodeURIComponent(bookingId)}`;
      const link = await paymongoService.createPaymentLink({
        booking_id: bookingId,
        booking_ids: [bookingId],
        amount: Number(studioPackage.package_price),
        currency: 'PHP',
        description: `${studioPackage.name} on ${bookingDate}, ${schedule.display_time}`,
        return_url: returnUrl,
      });
      const checkoutUrl = link.checkout_url || link.attributes?.checkout_url;
      if (!checkoutUrl) throw new Error('PayMongo did not return a checkout URL.');

      setPendingPaymentBooking({ paymentType: 'package', bookingId, bookingIds: [bookingId], paymentLinkId: link.id, paymentLinkUrl: checkoutUrl, createdAt: new Date().toISOString() });
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
      paymentWindow.location.href = checkoutUrl;
      paymentWindow.focus();
    } catch (error) {
      paymentWindow.close();
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
            {studioPackage.photography_minutes > 0 && <p className="flex gap-2"><Camera size={17} /> {studioPackage.photography_minutes} mins photography</p>}
            {studioPackage.edited_photos > 0 && <p className="flex gap-2"><Images size={17} /> {studioPackage.edited_photos} edited photos</p>}
            <p className="flex gap-2"><CheckCircle2 size={17} /> Access to all curated sets</p>
          </div>
          <div className="my-5 border-t border-white/15" />
          <div className="flex items-end justify-between"><span>Total</span><span className="text-3xl font-black">PHP {Number(studioPackage.package_price).toLocaleString()}</span></div>
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
