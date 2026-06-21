import api from '../index';

export interface BundlePackage {
  id: number;
  name: string;
  description?: string | null;
  booking_quantity: number;
  package_price: number | string;
  booking_type: 'professional_slots' | 'whole_studio';
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const bundlePackageService = {
  listActive: async (): Promise<BundlePackage[]> => {
    const response = await api.get<ApiEnvelope<BundlePackage[]>>('/bundle-packages');
    return response.success && Array.isArray(response.data) ? response.data : [];
  },
};

export default bundlePackageService;
