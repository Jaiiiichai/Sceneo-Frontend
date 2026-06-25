'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cartContext';
import { api } from '@/network';
import { useToast } from '@/lib/toastContext';
import { getCheckoutDraft, getSelectedCheckoutItemIds, setCheckoutDraft } from '@/lib/checkoutDraft';
import { ServiceAddon } from '@/lib/cartContext';
import { paymongoService } from '@/network/services/paymongoService';
import { setPendingPaymentBooking } from '@/lib/pendingPaymentBooking';
import { PAYMENT_STORAGE_EVENT } from '@/components/GlobalPaymentMonitor';

interface Provider {
  id: number;
  full_name: string;
  service_type: 'photography' | 'editor' | 'make_up_artist' | string;
  rate: number;
  rate_30_minutes?: number | null;
  rate_60_minutes?: number | null;
  available_durations?: number[];
  available_photography_options?: PhotographyOption[];
  remaining_minutes?: number;
  quote_required?: boolean;
}

type PhotographyOption = {
  key: string;
  label: string;
  duration_minutes: 30 | 60;
  start_offset_minutes: 0 | 30;
};

const HMUA_PACKAGE_OPTIONS = [
  {
    id: 'basic_makeup',
    label: 'Basic Makeup Only',
    description: 'Clean soft glam, no hairstyling',
    price: 2000,
  },
  {
    id: 'makeup_simple_hair',
    label: 'Makeup + Simple Hair Styling',
    description: 'Curls, straight, or basic styling',
    price: 3000,
  },
  {
    id: 'full_glam_editorial',
    label: 'Full Glam / Editorial / Concept Shoot',
    description: 'Glam looks for editorial or concept sessions',
    price: 3000,
  },
  {
    id: 'creative_fantasy_sfx',
    label: 'Creative / Fantasy / SFX Makeup',
    description: 'Special effects add-ons may require extra quotation',
    price: 4000,
  },
];

const HMUA_PACKAGE_SERVICE_TYPES = [
  'make_up_artist',
  'make_up_artist_false_lashes',
  'make_up_artist_touch_up',
  'make_up_artist_hair_extensions',
];

const EDITOR_PACKAGE_OPTIONS = [
  { photoCount: 10, label: '10 photos', rateKey: 'rate' },
  { photoCount: 20, label: '20 photos', rateKey: 'rate_30_minutes' },
  { photoCount: 30, label: '30 photos', rateKey: 'rate_60_minutes' },
] as const;

type HmuaSelection = {
  packageId: string;
  falseLashes: boolean;
  touchUp: boolean;
  hairExtensions: boolean;
};

type PendingConfirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
};

const resolveServiceType = (type: string | null): string | null => {
  if (!type) return null;
  if (type === 'photography' || type === 'editor' || type === 'make_up_artist') return type;
  if (type === 'photographer') return 'photography';
  if (type === 'makeup_artist') return 'make_up_artist';
  return type;
};

const getTitleByType = (type: string | null, serviceType: string | null): string => {
  if (type === 'photographer') return 'Select a Photographer';
  if (type === 'editor') return 'Select an Editor';
  if (type === 'makeup_artist') return 'Select a Make-up Artist';
  if (serviceType === 'photography') return 'Select a Photographer';
  if (serviceType === 'editor') return 'Select an Editor';
  if (serviceType === 'make_up_artist') return 'Select a Make-up Artist';
  return 'Select Provider';
};

export default function SelectProfessionalPage() {
  const router = useRouter();
  const { items, updateItem } = useCart();
  const { showToast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('Select Professional');
  const [hmuaSelections, setHmuaSelections] = useState<Record<number, HmuaSelection>>({});
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const getSearchParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  };

  const getCheckoutUrl = () => {
    const params = getSearchParams();
    params.delete('type');
    params.delete('addonBookingId');
    params.delete('addonBookingStatus');
    const query = params.toString();
    return query ? `/pages/booking/checkout?${query}` : '/pages/booking/checkout';
  };

  const getAddonBookingId = () => getSearchParams().get('addonBookingId');
  const getAddonBookingStatus = () => getSearchParams().get('addonBookingStatus');

  const getSelectedCartSlot = () => {
    const selectedIds = getSelectedCheckoutItemIds();
    return (
      items.find((item) => selectedIds.includes(item.id) && Boolean(item.timeSlotId)) ||
      [...items].reverse().find((item) => Boolean(item.timeSlotId))
    );
  };

  useEffect(() => {
    const fetchProviders = async () => {
      const searchParams = getSearchParams();
      const type = searchParams.get('type');
      const serviceType = resolveServiceType(type);
      const addonBookingId = searchParams.get('addonBookingId');

      if (!serviceType) {
        router.push(getCheckoutUrl());
        return;
      }

      setPageTitle(getTitleByType(type, serviceType));
      setLoading(true);

      try {
        const draft = getCheckoutDraft();
        const cartSlot = getSelectedCartSlot();
        const bookingDate = searchParams.get('date') || draft?.bookingDate || cartSlot?.bookingDate;
        const bookingTime = searchParams.get('time') || draft?.time || cartSlot?.time;
        const response = await api.get('/providers', {
          params: {
            service_type: serviceType,
            booking_date: addonBookingId ? bookingDate : bookingDate,
            booking_time: addonBookingId ? bookingTime : bookingTime,
          },
        });

        setProviders(response.success && Array.isArray(response.data) ? response.data : []);
      } catch {
        setProviders([]);
        showToast('Unable to load providers right now.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPhotographyRate = (pro: Provider, durationMinutes: 30 | 60) => {
    if (durationMinutes === 30) return Number(pro.rate_30_minutes ?? pro.rate ?? 0);
    return Number(pro.rate_60_minutes ?? pro.rate ?? 0);
  };

  const getProviderRateForSelection = (pro: Provider, durationMinutes?: 30 | 60) => {
    if (pro.service_type === 'photography' && durationMinutes) {
      return getPhotographyRate(pro, durationMinutes);
    }

    return Number(pro.rate || 0);
  };

  const getEditorPackageRate = (pro: Provider, rateKey: typeof EDITOR_PACKAGE_OPTIONS[number]['rateKey']) => {
    if (rateKey === 'rate_30_minutes') return Number(pro.rate_30_minutes ?? 850);
    if (rateKey === 'rate_60_minutes') return Number(pro.rate_60_minutes ?? 1200);
    return Number(pro.rate ?? 500);
  };

  const handleSelectEditorPackage = async (pro: Provider, option: typeof EDITOR_PACKAGE_OPTIONS[number]) => {
    const providerRate = getEditorPackageRate(pro, option.rateKey);
    await handleSelectProfessional(pro, undefined, undefined, {
      providerName: `${pro.full_name} - ${option.label}`,
      providerRate,
    });
  };

  const askToAddProvider = (
    pro: Provider,
    detail: string,
    onConfirm: () => Promise<void> | void
  ) => {
    setPendingConfirmation({
      title: 'Add this add-on?',
      message: `${pro.full_name} will be added to your booking${detail ? ` for ${detail}` : ''}.`,
      confirmLabel: 'Add Add-on',
      onConfirm,
    });
  };

  const confirmPendingAction = async () => {
    const action = pendingConfirmation;
    if (!action) return;

    setPendingConfirmation(null);
    await action.onConfirm();
  };

  const mapAddonsForApi = (addons: ServiceAddon[]) => addons.map((addon) => ({
    provider_id: addon.providerId,
    service_type: addon.serviceType,
    provider_name_snapshot: addon.providerName,
    provider_rate_snapshot: addon.providerRate,
    quote_required: Boolean(addon.quoteRequired),
    duration_minutes: addon.durationMinutes,
    start_offset_minutes: addon.startOffsetMinutes,
  }));

  const handleExistingBookingAddons = async (addons: ServiceAddon[], label: string) => {
    const addonBookingId = getAddonBookingId();
    if (!addonBookingId) return false;

    if (addons.some((addon) => addon.quoteRequired)) {
      showToast('Request-only or quotation add-ons cannot be paid online. Please contact the studio.', 'error');
      return true;
    }

    const amount = addons.reduce((sum, addon) => sum + Number(addon.providerRate || 0), 0);
    if (amount <= 0) {
      showToast('Please choose a paid add-on before continuing.', 'error');
      return true;
    }

    if (getAddonBookingStatus() === 'pending') {
      try {
        await api.post(`/bookings/${addonBookingId}/addons`, {
          addons: mapAddonsForApi(addons),
        }, { requiresAuth: true });
        showToast('Add-ons added to your unpaid booking balance. You can now pay the updated total.', 'success');
        router.push('/pages/bookings');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to add add-ons to this booking.', 'error');
      }

      return true;
    }

    const paymentWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!paymentWindow) {
      showToast('Please allow pop-ups so PayMongo checkout can open in a new tab.', 'error');
      return true;
    }

    try {
      const successUrl = `${window.location.origin}/pages/bookings?payment=success&bookingId=${encodeURIComponent(addonBookingId)}`;
      const paymentLink = await paymongoService.createAddonPaymentLink({
        booking_id: addonBookingId,
        amount,
        currency: 'PHP',
        description: `Sceneo Studio add-ons for booking ${addonBookingId}: ${label}`,
        return_url: successUrl,
        addons: mapAddonsForApi(addons),
      });

      const checkoutUrl = paymentLink.checkout_url || paymentLink.attributes?.checkout_url;
      if (!checkoutUrl) {
        paymentWindow.close();
        showToast('Unable to open QRPH payment link. Please try again.', 'error');
        return true;
      }

      setPendingPaymentBooking({
        bookingId: addonBookingId,
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: checkoutUrl,
        createdAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));

      paymentWindow.location.href = checkoutUrl;
      paymentWindow.focus();
      showToast('Add-on payment link opened in a new tab.', 'success');
      router.push('/pages/bookings');
    } catch (error) {
      paymentWindow.close();
      showToast(error instanceof Error ? error.message : 'Unable to create add-on payment link.', 'error');
    }

    return true;
  };

  const getHmuaSelection = (providerId: number): HmuaSelection => (
    hmuaSelections[providerId] || {
      packageId: HMUA_PACKAGE_OPTIONS[0].id,
      falseLashes: false,
      touchUp: false,
      hairExtensions: false,
    }
  );

  const updateHmuaSelection = (providerId: number, updates: Partial<HmuaSelection>) => {
    setHmuaSelections(prev => ({
      ...prev,
      [providerId]: {
        ...getHmuaSelection(providerId),
        ...updates,
      },
    }));
  };

  const buildHmuaAddons = (pro: Provider): ServiceAddon[] => {
    const selection = getHmuaSelection(pro.id);
    const selectedPackage = HMUA_PACKAGE_OPTIONS.find(option => option.id === selection.packageId) || HMUA_PACKAGE_OPTIONS[0];
    const addons: ServiceAddon[] = [
      {
        providerId: pro.id,
        serviceType: 'make_up_artist',
        providerName: `${pro.full_name} - ${selectedPackage.label}`,
        providerRate: selectedPackage.price,
        quoteRequired: false,
      },
    ];

    if (selection.falseLashes) {
      addons.push({
        providerId: pro.id,
        serviceType: 'make_up_artist_false_lashes',
        providerName: 'False lashes',
        providerRate: 400,
        quoteRequired: false,
      });
    }

    if (selection.touchUp) {
      addons.push({
        providerId: pro.id,
        serviceType: 'make_up_artist_touch_up',
        providerName: 'Touch-up on set',
        providerRate: 0,
        quoteRequired: true,
        requestOnly: true,
      });
    }

    if (selection.hairExtensions) {
      addons.push({
        providerId: pro.id,
        serviceType: 'make_up_artist_hair_extensions',
        providerName: 'Hair extensions / special materials',
        providerRate: 0,
        quoteRequired: true,
        requestOnly: true,
      });
    }

    return addons;
  };

  const getAvailablePhotographyOptions = (pro: Provider): PhotographyOption[] => {
    if (Array.isArray(pro.available_photography_options) && pro.available_photography_options.length > 0) {
      return pro.available_photography_options.filter((option): option is PhotographyOption => (
        (option.duration_minutes === 30 || option.duration_minutes === 60) &&
        (option.start_offset_minutes === 0 || option.start_offset_minutes === 30)
      ));
    }

    return [
      { key: 'first_30', label: 'First 30 mins', duration_minutes: 30, start_offset_minutes: 0 },
      { key: 'last_30', label: 'Last 30 mins', duration_minutes: 30, start_offset_minutes: 30 },
      { key: 'full_60', label: 'Full 1 hour', duration_minutes: 60, start_offset_minutes: 0 },
    ];
  };

  const handleSelectProfessional = async (
    pro: Provider,
    durationMinutes?: 30 | 60,
    startOffsetMinutes?: 0 | 30,
    override?: { providerName?: string; providerRate?: number }
  ) => {
    const providerRate = override?.providerRate ?? getProviderRateForSelection(pro, durationMinutes);
    const providerName = override?.providerName ?? pro.full_name;
    const existingBookingFlowHandled = await handleExistingBookingAddons([
      {
        providerId: pro.id,
        serviceType: pro.service_type,
        providerName,
        providerRate,
        quoteRequired: pro.quote_required,
        durationMinutes,
        startOffsetMinutes,
      },
    ], providerName);
    if (existingBookingFlowHandled) return;

    const searchParams = getSearchParams();
    const hasSlotItem = items.some(item => Boolean(item.timeSlotId));
    const currentDraft = getCheckoutDraft();
    const hasDirectBookingParams = Boolean(
      searchParams.get('studioId') || searchParams.get('timeSlotId')
    );
    const hasDraftBooking = Boolean(currentDraft?.timeSlotId);

    if (!hasDirectBookingParams && !hasDraftBooking && !hasSlotItem) {
      showToast('Please select a slot first before choosing a provider.', 'error');
      return;
    }

    const shouldReplaceServiceType = pro.service_type !== 'photography';

    if (hasDraftBooking && currentDraft) {
      setCheckoutDraft({
        ...currentDraft,
        serviceProviderId: pro.id,
        serviceType: pro.service_type,
        serviceProviderName: providerName,
        serviceProviderRate: providerRate,
        serviceAddons: [
          ...(currentDraft.serviceAddons || []).filter((addon) => (
            shouldReplaceServiceType ? addon.serviceType !== pro.service_type : true
          )),
          {
            providerId: pro.id,
            serviceType: pro.service_type,
            providerName,
            providerRate,
            quoteRequired: pro.quote_required,
            durationMinutes,
            startOffsetMinutes,
          },
        ],
      });

      showToast(`${providerName} added (+PHP ${providerRate.toLocaleString()})`, 'success');
      router.push('/pages/booking/checkout');
      return;
    }

    if (hasSlotItem) {
      const targetSlot = getSelectedCartSlot();
      if (!targetSlot) return;

      await updateItem({
        ...targetSlot,
        serviceProviderId: pro.id,
        serviceType: pro.service_type,
        serviceProviderName: providerName,
        serviceProviderRate: providerRate,
        serviceAddons: [
          ...(targetSlot.serviceAddons || []).filter((addon) => (
            shouldReplaceServiceType ? addon.serviceType !== pro.service_type : true
          )),
          {
            providerId: pro.id,
            serviceType: pro.service_type,
            providerName,
            providerRate,
            quoteRequired: pro.quote_required,
            durationMinutes,
            startOffsetMinutes,
          },
        ],
      });

      showToast(`${providerName} added (+PHP ${providerRate.toLocaleString()})`, 'success');
      router.push(getCheckoutUrl());

      return;
    }

    const params = getSearchParams();
    params.delete('type');
    params.set('provider_id', String(pro.id));
    params.set('provider_type', pro.service_type);
    params.set('provider_name', providerName);
    params.set('provider_rate', String(providerRate));
    params.set('provider_quote_required', String(Boolean(pro.quote_required)));
    if (durationMinutes) {
      params.set('provider_duration_minutes', String(durationMinutes));
    } else {
      params.delete('provider_duration_minutes');
    }
    if (startOffsetMinutes != null) {
      params.set('provider_start_offset_minutes', String(startOffsetMinutes));
    } else {
      params.delete('provider_start_offset_minutes');
    }

    router.push(`/pages/booking/checkout?${params.toString()}`);
  };

  const handleSelectHmua = async (pro: Provider) => {
    const searchParams = getSearchParams();
    const hasSlotItem = items.some(item => Boolean(item.timeSlotId));
    const currentDraft = getCheckoutDraft();
    const hasDirectBookingParams = Boolean(
      searchParams.get('studioId') || searchParams.get('timeSlotId')
    );
    const hasDraftBooking = Boolean(currentDraft?.timeSlotId);
    const addons = buildHmuaAddons(pro);
    const total = addons.reduce((sum, addon) => sum + (addon.quoteRequired ? 0 : Number(addon.providerRate || 0)), 0);
    const selectedPackageLabel = addons[0]?.providerName || `${pro.full_name} HMUA package`;
    const existingBookingFlowHandled = await handleExistingBookingAddons(addons, selectedPackageLabel);
    if (existingBookingFlowHandled) return;

    if (!hasDirectBookingParams && !hasDraftBooking && !hasSlotItem) {
      showToast('Please select a slot first before choosing a provider.', 'error');
      return;
    }

    if (hasDraftBooking && currentDraft) {
      const existingAddons = (currentDraft.serviceAddons || []).filter(
        (addon) => !HMUA_PACKAGE_SERVICE_TYPES.includes(addon.serviceType)
      );
      setCheckoutDraft({
        ...currentDraft,
        serviceProviderId: addons[0].providerId,
        serviceType: addons[0].serviceType,
        serviceProviderName: addons[0].providerName,
        serviceProviderRate: addons[0].providerRate,
        serviceAddons: [...existingAddons, ...addons],
      });

      showToast(`${pro.full_name} HMUA package added (+PHP ${total.toLocaleString()})`, 'success');
      router.push('/pages/booking/checkout');
      return;
    }

    if (hasSlotItem) {
      const targetSlot = getSelectedCartSlot();
      if (!targetSlot) return;

      const existingAddons = (targetSlot.serviceAddons || []).filter(
        (addon) => !HMUA_PACKAGE_SERVICE_TYPES.includes(addon.serviceType)
      );

      await updateItem({
        ...targetSlot,
        serviceProviderId: addons[0].providerId,
        serviceType: addons[0].serviceType,
        serviceProviderName: addons[0].providerName,
        serviceProviderRate: addons[0].providerRate,
        serviceAddons: [...existingAddons, ...addons],
      });

      showToast(`${pro.full_name} HMUA package added (+PHP ${total.toLocaleString()})`, 'success');
      router.push(getCheckoutUrl());

      return;
    }

    showToast('Please return to checkout and try adding this HMUA package again.', 'error');
  };

  const isAddonPaymentMode = Boolean(getAddonBookingId());
  const isPendingAddonMode = getAddonBookingStatus() === 'pending';
  const selectedServiceType = resolveServiceType(getSearchParams().get('type'));

  return (
    <main className="min-h-screen bg-[#e5e7eb] py-5 pt-7">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Booking add-ons</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
            {selectedServiceType === 'photography'
              ? 'All raw photos will be provided for photography sessions, with FREE 5 edited photos. Professional photo editing beyond the free set may be purchased as an optional add-on.'
              : isAddonPaymentMode
              ? isPendingAddonMode
                ? 'Choose an add-on for your pending booking. It will be added to your unpaid balance.'
                : 'Choose an add-on for your paid booking. Payment is required before it is attached.'
              : 'Choose one provider or package to attach to your selected booking.'}
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">No providers are scheduled for this booking time.</div>
          ) : (
            providers.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-slate-950">{p.full_name}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-slate-600">
                        {p.service_type.split('_').join(' ')}
                      </span>
                    </div>
                    {p.service_type === 'photography' && typeof p.remaining_minutes === 'number' && (
                      <p className="mt-2 text-sm font-semibold text-slate-500">{p.remaining_minutes} photography minutes left for this slot</p>
                    )}
                    {p.service_type === 'editor' && (
                      <p className="mt-2 text-sm font-semibold text-slate-500">Select how many edited photos you need.</p>
                    )}
                    {p.service_type === 'make_up_artist' && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm font-semibold text-slate-500">Choose a makeup package and optional requests.</p>
                        <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                          Please arrive at least 1 hour before your scheduled session if you have a makeup appointment.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-black text-slate-900">
                    {p.quote_required
                      ? 'For quotation'
                      : p.service_type === 'photography'
                        ? `PHP ${getPhotographyRate(p, 30).toLocaleString()} / PHP ${getPhotographyRate(p, 60).toLocaleString()}`
                      : p.service_type === 'editor'
                        ? 'Package pricing'
                      : p.service_type === 'make_up_artist'
                        ? 'Fixed packages'
                        : `PHP ${Number(p.rate).toLocaleString()}`}
                  </div>
                </div>

                <div className="mt-5">
                {p.service_type === 'make_up_artist' ? (
                  null
                ) : p.service_type === 'editor' && !p.quote_required ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {EDITOR_PACKAGE_OPTIONS.map((option) => (
                      <button
                        key={`${p.id}-${option.photoCount}`}
                        onClick={() => askToAddProvider(
                          p,
                          `${option.label} at PHP ${getEditorPackageRate(p, option.rateKey).toLocaleString()}`,
                          () => handleSelectEditorPackage(p, option)
                        )}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white hover:shadow-sm"
                      >
                        <span className="block text-lg font-black text-slate-950">{option.label}</span>
                        <span className="mt-1 block text-sm font-bold text-slate-600">
                          PHP {getEditorPackageRate(p, option.rateKey).toLocaleString()}
                        </span>
                        <span className="mt-3 inline-flex text-sm font-black text-slate-950">Add package</span>
                      </button>
                    ))}
                  </div>
                ) : p.service_type === 'photography' && !p.quote_required ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {getAvailablePhotographyOptions(p).map((option) => {
                      const rate = getPhotographyRate(p, option.duration_minutes);
                      return (
                        <button
                          key={`${p.id}-${option.key}`}
                          onClick={() => askToAddProvider(
                            p,
                            `${option.label} at PHP ${rate.toLocaleString()}`,
                            () => handleSelectProfessional(p, option.duration_minutes, option.start_offset_minutes)
                          )}
                          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                        >
                          {option.label} · PHP {rate.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => askToAddProvider(p, '', () => handleSelectProfessional(p))}
                    className="w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 sm:w-auto"
                  >
                    Select
                  </button>
                )}
                </div>
                {p.service_type === 'make_up_artist' && (
                  <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-4">
                    <p className="mb-3 text-sm font-bold text-rose-900">HMUA Rate Card</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {HMUA_PACKAGE_OPTIONS.map((option) => {
                        const selected = getHmuaSelection(p.id).packageId === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateHmuaSelection(p.id, { packageId: option.id })}
                            className={`rounded-lg border p-3 text-left transition-colors ${
                              selected
                                ? 'border-slate-950 bg-white shadow-sm'
                                : 'border-rose-100 bg-white/70 hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-black text-slate-950">{option.label}</p>
                                <p className="mt-1 text-xs text-slate-600">{option.description}</p>
                              </div>
                              <span className="text-sm font-black text-slate-950">PHP {option.price.toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <label className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={getHmuaSelection(p.id).falseLashes}
                          onChange={(event) => updateHmuaSelection(p.id, { falseLashes: event.target.checked })}
                          className="mt-1"
                        />
                        <span>False lashes <span className="text-slate-500">PHP 400</span></span>
                      </label>
                      <label className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={getHmuaSelection(p.id).touchUp}
                          onChange={(event) => updateHmuaSelection(p.id, { touchUp: event.target.checked })}
                          className="mt-1"
                        />
                        <span>Touch-up on set <span className="text-slate-500">request only</span></span>
                      </label>
                      <label className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={getHmuaSelection(p.id).hairExtensions}
                          onChange={(event) => updateHmuaSelection(p.id, { hairExtensions: event.target.checked })}
                          className="mt-1"
                        />
                        <span>Hair extensions / special materials <span className="text-slate-500">request only</span></span>
                      </label>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Group bookings for 4 pax and above are available by email inquiry.
                    </p>
                    <button
                      type="button"
                      onClick={() => askToAddProvider(p, 'the selected HMUA package', () => handleSelectHmua(p))}
                      className="mt-4 w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 sm:w-auto"
                    >
                      Add HMUA Package
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
            Please be on time for your session. To ensure a smooth experience for all guests, sessions will start and end as scheduled and cannot be extended due to late arrivals. Thank you for your understanding.
          </div>
          <button
            onClick={() => router.push(isAddonPaymentMode ? '/pages/bookings' : getCheckoutUrl())}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            {isAddonPaymentMode ? 'Back to My Bookings' : 'Back to Checkout'}
          </button>
        </div>
      </div>

      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close confirmation"
            onClick={() => setPendingConfirmation(null)}
          />
          <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-950">{pendingConfirmation.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{pendingConfirmation.message}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="rounded-lg bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingAction}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
              >
                {pendingConfirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

