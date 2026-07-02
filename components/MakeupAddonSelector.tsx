'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { api } from '@/network';
import { ServiceAddon } from '@/lib/cartContext';

type Provider = {
  id: number;
  full_name: string;
};

type Selection = {
  packageId: string;
  falseLashes: boolean;
  touchUp: boolean;
  hairExtensions: boolean;
};

const PACKAGES = [
  { id: 'basic_makeup', label: 'Basic Makeup Only', description: 'Clean soft glam, no hairstyling', price: 2000 },
  { id: 'makeup_simple_hair', label: 'Makeup + Simple Hair Styling', description: 'Curls, straight, or basic styling', price: 3000 },
  { id: 'full_glam_editorial', label: 'Full Glam / Editorial / Concept Shoot', description: 'Glam looks for editorial or concept sessions', price: 3000 },
  { id: 'creative_fantasy_sfx', label: 'Creative / Fantasy / SFX Makeup', description: 'Special effects add-ons may require extra quotation', price: 4000 },
];

const DEFAULT_SELECTION: Selection = {
  packageId: PACKAGES[0].id,
  falseLashes: false,
  touchUp: false,
  hairExtensions: false,
};

interface Props {
  bookingDate: string;
  bookingTime: string;
  value: ServiceAddon[];
  onChange: (addons: ServiceAddon[]) => void;
}

export default function MakeupAddonSelector({ bookingDate, bookingTime, value, onChange }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);

  useEffect(() => {
    let active = true;
    api.get('/providers', {
      params: { service_type: 'make_up_artist', booking_date: bookingDate, booking_time: bookingTime },
    }).then((response) => {
      if (!active) return;
      const available = response.success && Array.isArray(response.data) ? response.data : [];
      setProviders(available);
      setSelectedProviderId((current) => current ?? available[0]?.id ?? null);
    }).catch(() => {
      if (active) setProviders([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [bookingDate, bookingTime]);

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId) || null;
  const selectedPackage = PACKAGES.find((item) => item.id === selection.packageId) || PACKAGES[0];
  const applied = value.length > 0;

  const applySelection = () => {
    if (!selectedProvider) return;
    const addons: ServiceAddon[] = [{
      providerId: selectedProvider.id,
      serviceType: 'make_up_artist',
      providerName: `${selectedProvider.full_name} - ${selectedPackage.label}`,
      providerRate: selectedPackage.price,
      quoteRequired: false,
    }];
    if (selection.falseLashes) addons.push({ providerId: selectedProvider.id, serviceType: 'make_up_artist_false_lashes', providerName: 'False lashes', providerRate: 400, quoteRequired: false });
    if (selection.touchUp) addons.push({ providerId: selectedProvider.id, serviceType: 'make_up_artist_touch_up', providerName: 'Touch-up on set', providerRate: 0, quoteRequired: true, requestOnly: true });
    if (selection.hairExtensions) addons.push({ providerId: selectedProvider.id, serviceType: 'make_up_artist_hair_extensions', providerName: 'Hair extensions / special materials', providerRate: 0, quoteRequired: true, requestOnly: true });
    onChange(addons);
  };

  return (
    <div className="mt-7 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white"><Sparkles size={20} /></span>
          <div><h2 className="font-black text-slate-950">Add professional make-up <span className="text-sm font-semibold text-slate-500">(Optional)</span></h2><p className="mt-1 text-sm text-slate-600">Make-up is optional. Choose a scheduled artist and package only if you would like to add one.</p></div>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">Please arrive at least 1 hour before your scheduled session if you have a makeup appointment.</p>

      {loading ? <div className="flex items-center gap-2 py-6 text-sm text-slate-600"><Loader2 size={17} className="animate-spin" /> Loading available artists...</div> : providers.length === 0 ? (
        <p className="py-6 text-sm font-semibold text-slate-600">No make-up artist is scheduled for this package time.</p>
      ) : (
        <>
          {providers.length > 1 && <label className="mt-4 block text-sm font-bold text-slate-700">Make-up artist<select value={selectedProviderId ?? ''} onChange={(event) => setSelectedProviderId(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.full_name}</option>)}</select></label>}
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-950">HMUA Rate Card</p>
            <div className="grid gap-3 sm:grid-cols-2">{PACKAGES.map((option) => <button key={option.id} type="button" onClick={() => setSelection((current) => ({ ...current, packageId: option.id }))} className={`rounded-lg border p-3 text-left ${selection.packageId === option.id ? 'border-slate-950 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'}`}><div className="flex justify-between gap-3"><div><p className="text-sm font-black">{option.label}</p><p className="mt-1 text-xs text-slate-600">{option.description}</p></div><span className="shrink-0 text-sm font-black">PHP {option.price.toLocaleString()}</span></div></button>)}</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <label className="flex gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={selection.falseLashes} onChange={(event) => setSelection((current) => ({ ...current, falseLashes: event.target.checked }))} /> <span>False lashes <span className="text-slate-500">PHP 400</span></span></label>
              <label className="flex gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={selection.touchUp} onChange={(event) => setSelection((current) => ({ ...current, touchUp: event.target.checked }))} /> <span>Touch-up <span className="text-slate-500">request only</span></span></label>
              <label className="flex gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={selection.hairExtensions} onChange={(event) => setSelection((current) => ({ ...current, hairExtensions: event.target.checked }))} /> <span>Hair extensions <span className="text-slate-500">request only</span></span></label>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">Group bookings for 4 pax and above are available by email inquiry.</p>
            <button type="button" onClick={applySelection} className="mt-4 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white">{applied ? 'Update HMUA Package' : 'Add HMUA Package'}</button>
          </div>
        </>
      )}
    </div>
  );
}
