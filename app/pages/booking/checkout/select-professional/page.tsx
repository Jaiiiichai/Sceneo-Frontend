'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cartContext';
import { api } from '@/network';
import { useToast } from '@/lib/toastContext';
import { getCheckoutDraft, setCheckoutDraft } from '@/lib/checkoutDraft';

interface Provider {
  id: number;
  full_name: string;
  service_type: 'photography' | 'editor' | 'make_up_artist' | string;
  rate: number;
  quote_required?: boolean;
}

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
  const { items, attachServiceToLatestSlot } = useCart();
  const { showToast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('Select Professional');

  const getSearchParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  };

  const getCheckoutUrl = () => {
    const params = getSearchParams();
    params.delete('type');
    const query = params.toString();
    return query ? `/pages/booking/checkout?${query}` : '/pages/booking/checkout';
  };

  useEffect(() => {
    const fetchProviders = async () => {
      const searchParams = getSearchParams();
      const type = searchParams.get('type');
      const serviceType = resolveServiceType(type);

      if (!serviceType) {
        router.push(getCheckoutUrl());
        return;
      }

      setPageTitle(getTitleByType(type, serviceType));
      setLoading(true);

      try {
        const draft = getCheckoutDraft();
        const cartSlot = items.find(item => Boolean(item.timeSlotId));
        const bookingDate = searchParams.get('date') || draft?.bookingDate || cartSlot?.bookingDate;
        const bookingTime = searchParams.get('time') || draft?.time || cartSlot?.time;
        const response = await api.get('/providers', {
          params: {
            service_type: serviceType,
            booking_date: bookingDate,
            booking_time: bookingTime,
          },
        });

        setProviders(response.success && Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setProviders([]);
        showToast('Unable to load providers right now.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectProfessional = async (pro: Provider) => {
    const searchParams = getSearchParams();
    const hasSlotItem = items.some(item => Boolean(item.timeSlotId));
    const currentDraft = getCheckoutDraft();
    const hasDirectBookingParams = Boolean(
      searchParams.get('studioId') || searchParams.get('timeSlotId')
    );
    const hasDraftBooking = Boolean(currentDraft?.timeSlotId);

    if (hasSlotItem) {
      const latestSlot = items.find(item => Boolean(item.timeSlotId));
      if (!latestSlot) return;

      const attached = await attachServiceToLatestSlot({
        providerId: pro.id,
        serviceType: pro.service_type,
        providerName: pro.full_name,
        providerRate: pro.rate,
        quoteRequired: pro.quote_required,
        updatedPrice: latestSlot.price,
      });

      if (attached) {
        showToast(`${pro.full_name} added (+PHP ${pro.rate})`, 'success');
        router.push(getCheckoutUrl());
      }

      return;
    }

    if (!hasDirectBookingParams && !hasDraftBooking) {
      showToast('Please select a slot first before choosing a provider.', 'error');
      return;
    }

    if (hasDraftBooking && currentDraft) {
      setCheckoutDraft({
        ...currentDraft,
        serviceProviderId: pro.id,
        serviceType: pro.service_type,
        serviceProviderName: pro.full_name,
        serviceProviderRate: pro.rate,
        serviceAddons: [
          ...(currentDraft.serviceAddons || []).filter((addon) => addon.serviceType !== pro.service_type),
          {
            providerId: pro.id,
            serviceType: pro.service_type,
            providerName: pro.full_name,
            providerRate: pro.rate,
            quoteRequired: pro.quote_required,
          },
        ],
      });

      showToast(`${pro.full_name} added (+PHP ${pro.rate})`, 'success');
      router.push('/pages/booking/checkout');
      return;
    }

    const params = getSearchParams();
    params.delete('type');
    params.set('provider_id', String(pro.id));
    params.set('provider_type', pro.service_type);
    params.set('provider_name', pro.full_name);
    params.set('provider_rate', String(pro.rate));
    params.set('provider_quote_required', String(Boolean(pro.quote_required)));

    router.push(`/pages/booking/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-transparent py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>

        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading providers...</p>
          ) : providers.length === 0 ? (
            <p className="text-gray-500">No providers are scheduled for this booking time.</p>
          ) : (
            providers.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between transition-colors gap-4"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{p.full_name}</h3>
                    <span className="text-md font-bold text-gray-900">
                      {p.quote_required ? 'For quotation' : `PHP ${Number(p.rate).toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Service Type: {p.service_type}</p>
                </div>
                <button
                  onClick={() => handleSelectProfessional(p)}
                  className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                >
                  Select
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push(getCheckoutUrl())}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
