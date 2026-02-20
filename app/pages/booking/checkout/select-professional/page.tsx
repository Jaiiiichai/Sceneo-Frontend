'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cartContext';
import { api } from '@/network';
import { useToast } from '@/lib/toastContext';

interface Provider {
  id: number;
  full_name: string;
  service_type: 'photography' | 'editor' | 'make_up_artist' | string;
  rate: number;
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
  const searchParams = useSearchParams();
  const { addItem, items, attachServiceToLatestSlot } = useCart();
  const { showToast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState('Select Professional');

  useEffect(() => {
    const fetchProviders = async () => {
      const type = searchParams.get('type');
      const serviceType = resolveServiceType(type);

      if (!serviceType) {
        router.push('/pages/booking/checkout');
        return;
      }

      setPageTitle(getTitleByType(type, serviceType));
      setLoading(true);

      try {
        const response = await api.get('/providers', {
          params: { service_type: serviceType },
        });

        if (response.success && Array.isArray(response.data)) {
          setProviders(response.data);
        } else {
          setProviders([]);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setProviders([]);
        showToast('Unable to load providers right now.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [searchParams, router]);

  const handleSelectProfessional = async (pro: Provider) => {
    const hasSlotItem = items.some(item => Boolean(item.timeSlotId));
    const hasDirectBookingParams = Boolean(searchParams.get('studioId') || searchParams.get('timeSlotId'));

    if (hasSlotItem) {
      const attached = await attachServiceToLatestSlot({
        providerId: pro.id,
        serviceType: pro.service_type,
        providerName: pro.full_name,
      });

      if (attached) {
        router.push('/pages/booking/checkout');
      }
      return;
    }

    if (!hasDirectBookingParams) {
      showToast('Please select a slot first before choosing a provider.', 'error');
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('type');
    params.set('provider_id', String(pro.id));
    params.set('provider_type', pro.service_type);
    params.set('provider_name', pro.full_name);
    router.push(`/pages/booking/checkout?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>

        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading providers...</p>
          ) : providers.length === 0 ? (
            <p className="text-gray-500">No providers available for this service type.</p>
          ) : (
            providers.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between transition-colors gap-4" // Changed to horizontal flex
              >
                <div className="flex-grow"> {/* Details take up available space */}
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{p.full_name}</h3>
                    <span className="text-md font-bold text-gray-900">₱{p.rate}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Service Type: {p.service_type}</p>
                </div>
                <button
                  onClick={() => handleSelectProfessional(p)}
                  className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors" // Button on the right
                >
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/pages/booking/checkout')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
