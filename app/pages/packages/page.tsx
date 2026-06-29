'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Camera, Check, Clock3, Images, Loader2, Users } from 'lucide-react';
import studioPackageService, { PackageAvailability, StudioPackage } from '@/network/services/studioPackageService';

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export default function StudioPackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedGroup = searchParams.get('group') || '';
  const [packages, setPackages] = useState<StudioPackage[]>([]);
  const [audience, setAudience] = useState('solo');
  const [selectedPackage, setSelectedPackage] = useState<StudioPackage | null>(null);
  const [bookingDate, setBookingDate] = useState(today());
  const [availability, setAvailability] = useState<PackageAvailability[]>([]);
  const [selectedTime, setSelectedTime] = useState<PackageAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    studioPackageService.list()
      .then((data) => {
        const initialAudience = requestedGroup && data.some((item) => item.audience_key === requestedGroup)
          ? requestedGroup
          : 'solo';
        setPackages(data);
        setAudience(initialAudience);
        setSelectedPackage(data.find((item) => item.audience_key === initialAudience) || null);
      })
      .finally(() => setLoading(false));
  }, [requestedGroup]);

  useEffect(() => {
    if (!selectedPackage || !bookingDate) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    studioPackageService.availability(selectedPackage.id, bookingDate)
      .then(setAvailability)
      .catch(() => setAvailability([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedPackage, bookingDate]);

  const audiences = useMemo(() => {
    const seen = new Set<string>();
    return packages.filter((item) => {
      if (seen.has(item.audience_key)) return false;
      seen.add(item.audience_key);
      return true;
    });
  }, [packages]);

  const visiblePackages = packages.filter((item) => item.audience_key === audience);

  const chooseAudience = (key: string) => {
    setAudience(key);
    setSelectedPackage(packages.find((item) => item.audience_key === key) || null);
  };

  const continueToCheckout = () => {
    if (!selectedPackage || !selectedTime) return;
    const params = new URLSearchParams({
      packageId: String(selectedPackage.id),
      date: bookingDate,
      slotIds: selectedTime.time_slot_ids.join(','),
    });
    router.push(`/pages/packages/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#e5e7eb] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-lg bg-slate-950 px-6 py-8 text-white sm:px-9">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Sceneo Studio Packages</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Pick the bundle that fits your group.</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">Choose your group size, package inclusions, date, and starting time. We will reserve every covered studio slot together.</p>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Step 1</p>
                <h2 className="mt-1 text-2xl font-black">Choose your group</h2>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {audiences.map((item) => (
                    <button key={item.audience_key} type="button" onClick={() => chooseAudience(item.audience_key)} className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${audience === item.audience_key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-500'}`}>
                      {item.audience_name}<span className="mt-1 block text-xs font-semibold opacity-70">{item.slot_quantity} {item.slot_quantity === 1 ? 'guest' : 'guests'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePackages.map((item) => {
                  const selected = selectedPackage?.id === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => setSelectedPackage(item)} className={`relative min-h-64 rounded-lg border p-5 text-left shadow-sm transition ${selected ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white hover:-translate-y-0.5 hover:border-slate-600'}`}>
                      {selected && <Check className="absolute right-4 top-4" size={20} />}
                      <p className={`text-xs font-black uppercase tracking-[0.18em] ${selected ? 'text-amber-300' : 'text-teal-700'}`}>Bundle {item.bundle_code}</p>
                      <p className="mt-3 text-3xl font-black">PHP {Number(item.package_price).toLocaleString()}</p>
                      <div className={`mt-5 space-y-3 border-t pt-4 text-sm ${selected ? 'border-white/15 text-slate-200' : 'border-slate-200 text-slate-600'}`}>
                        <p className="flex gap-2"><Clock3 size={17} className="shrink-0" /> {item.access_minutes / 60} {item.access_minutes === 60 ? 'hour' : 'hours'} studio access</p>
                        {item.photography_minutes > 0 && <p className="flex gap-2"><Camera size={17} className="shrink-0" /> {item.photography_minutes} mins photography</p>}
                        {item.edited_photos > 0 && <p className="flex gap-2"><Images size={17} className="shrink-0" /> {item.edited_photos} edited photos</p>}
                        <p className="flex gap-2"><Users size={17} className="shrink-0" /> Access to all curated sets</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Step 2</p>
                <h2 className="mt-1 text-2xl font-black">Choose a date and starting time</h2>
                <label className="mt-4 block max-w-sm text-sm font-bold text-slate-700">Booking date
                  <input type="date" min={today()} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-slate-950" />
                </label>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {slotsLoading ? <p className="flex items-center gap-2 text-slate-500"><Loader2 size={17} className="animate-spin" /> Checking availability...</p> : availability.length === 0 ? <p className="rounded-lg bg-slate-100 p-4 text-sm font-semibold text-slate-600">No starting times can fit this package on the selected date.</p> : availability.map((slot) => (
                    <button key={slot.start_slot_id} type="button" onClick={() => setSelectedTime(slot)} className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left ${selectedTime?.start_slot_id === slot.start_slot_id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 hover:border-slate-500'}`}>
                      <span><span className="block font-black">{slot.display_time}</span><span className="text-xs opacity-70">Start to end</span></span>
                      <CalendarDays size={19} />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-lg bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-24">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Your Package</p>
              <h2 className="mt-2 text-2xl font-black">{selectedPackage?.name || 'Choose a package'}</h2>
              {selectedPackage && <>
                <p className="mt-2 text-sm text-slate-400">{selectedPackage.audience_name} · {selectedPackage.slot_quantity} {selectedPackage.slot_quantity === 1 ? 'guest' : 'guests'}</p>
                <div className="my-5 border-t border-white/15" />
                <p className="text-sm text-slate-400">Schedule</p>
                <p className="mt-1 font-bold">{selectedTime ? selectedTime.display_time : 'Select a starting time'}</p>
                <p className="mt-1 text-sm text-slate-400">{bookingDate}</p>
                <div className="my-5 border-t border-white/15" />
                <div className="flex items-end justify-between"><span className="text-slate-300">Total</span><span className="text-3xl font-black">PHP {Number(selectedPackage.package_price).toLocaleString()}</span></div>
              </>}
              <button type="button" disabled={!selectedPackage || !selectedTime} onClick={continueToCheckout} className="mt-6 w-full rounded-lg bg-white px-5 py-3.5 font-black text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-40">Continue to Checkout</button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
