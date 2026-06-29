import { api } from '@/network';

export interface StudioPackage {
  id: number;
  audience_key: string;
  audience_name: string;
  bundle_code: 'A' | 'B' | 'C' | 'D' | 'E';
  name: string;
  slot_quantity: number;
  access_minutes: number;
  photography_minutes: number;
  edited_photos: number;
  package_price: number;
  makeup_available: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface PackageAvailability {
  start_slot_id: string;
  time_slot_ids: string[];
  start_time: string;
  end_time: string;
  display_time: string;
  remaining: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

const studioPackageService = {
  list: async () => {
    const response = await api.get<ApiEnvelope<StudioPackage[]>>('/studio-packages');
    return response.data || [];
  },
  availability: async (packageId: number, bookingDate: string) => {
    const response = await api.get<ApiEnvelope<PackageAvailability[]>>('/studio-packages/availability', {
      params: { package_id: packageId, booking_date: bookingDate },
    });
    return response.data || [];
  },
  book: async (payload: {
    package_id: number;
    booking_date: string;
    time_slot_ids: string[];
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  }) => api.post<ApiEnvelope<Record<string, unknown>>>('/studio-packages/book', payload, { requiresAuth: true }),
};

export default studioPackageService;
