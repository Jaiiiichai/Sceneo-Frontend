import api, { API_ENDPOINTS } from '../index';

export interface AddCartItemPayload {
  time_slot_id: string;
  booking_date: string;
  quantity: number;
  addons?: CartAddonPayload[];
}

export interface CartAddonPayload {
  providerId?: number | null;
  serviceType?: string;
  providerName?: string;
  providerRate?: number;
  quoteRequired?: boolean;
  durationMinutes?: number | null;
  startOffsetMinutes?: number | null;
  requestOnly?: boolean;
}

export interface CartTimeSlot {
  id: string;
  price: number;
  capacity: number;
  end_time: string;
  start_time: string;
  booking_type: 'professional_slots' | 'whole_studio';
  display_time: string;
}

export interface CartItemResponse {
  id: number;
  cart_id: number;
  time_slot_id: string;
  booking_date: string;
  quantity: number;
  price_at_time: number;
  addons?: CartAddonPayload[];
  created_at: string;
  time_slots?: CartTimeSlot;
  line_total: number;
}

export interface CartSummary {
  total_items: number;
  total_amount: number;
}

export interface CartResponse {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: CartItemResponse[];
  summary?: CartSummary;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface UpdateCartItemPayload {
  quantity?: number;
  addons?: CartAddonPayload[];
}

export const cartService = {
  getCart: async (): Promise<CartResponse | null> => {
    const response = await api.get<ApiEnvelope<CartResponse>>(API_ENDPOINTS.carts.get, {
      requiresAuth: true,
    });

    if (!response?.success || !response.data) {
      return null;
    }

    return response.data;
  },

  addItem: async (payload: AddCartItemPayload): Promise<CartResponse | null> => {
    const response = await api.post<ApiEnvelope<CartResponse>>(API_ENDPOINTS.carts.addItem, payload, {
      requiresAuth: true,
    });

    if (!response?.success || !response.data) {
      return null;
    }

    return response.data;
  },

  updateItemQuantity: async (itemId: number | string, quantity: number): Promise<CartResponse | null> => {
    return cartService.updateItem(itemId, { quantity });
  },

  updateItem: async (itemId: number | string, payload: UpdateCartItemPayload): Promise<CartResponse | null> => {
    const response = await api.put<ApiEnvelope<CartResponse> | CartResponse>(
      API_ENDPOINTS.carts.updateItem(itemId),
      payload,
      {
        requiresAuth: true,
      }
    );

    if (response && typeof response === 'object' && 'success' in response) {
      return response.success && response.data ? response.data : null;
    }

    return (response as CartResponse) || null;
  },

  removeItem: async (itemId: number | string): Promise<void> => {
    await api.delete(API_ENDPOINTS.carts.removeItem(itemId), {
      requiresAuth: true,
    });
  },

  clearCart: async (): Promise<void> => {
    await api.delete(API_ENDPOINTS.carts.clear, {
      requiresAuth: true,
    });
  },
};

export default cartService;
