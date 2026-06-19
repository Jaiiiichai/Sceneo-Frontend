import api, { APIError } from '../index';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaymentIntentAttributes {
  amount: number;
  currency: string;
  status: string;
  client_key?: string;
  next_action?: {
    type?: string;
    redirect?: {
      url?: string;
      return_url?: string;
    };
  };
  last_payment_error?: {
    message?: string;
  };
}

export interface PaymentIntentResponse {
  id: string;
  attributes: PaymentIntentAttributes;
}

export interface PaymentLinkResponse {
  id: string;
  checkout_url?: string;
  amount?: number;
  currency?: string;
  reference_number?: string;
  remarks?: string;
  status?: string;
  attributes?: {
    checkout_url?: string;
    status?: string;
  };
}

export interface PaymentLinkSyncResponse {
  status: 'paid' | 'pending' | 'final_unpaid' | 'missing_booking_reference' | string;
  data?: unknown;
  message?: string;
}

const unwrapResponse = <T>(response: ApiEnvelope<T> | T): T => {
  if (response && typeof response === 'object' && 'success' in response) {
    const envelope = response as ApiEnvelope<T>;
    if (!envelope.success || !envelope.data) {
      throw new Error(envelope.message || 'Payment request failed.');
    }

    const nestedData = (envelope.data as { data?: T })?.data;
    return (nestedData ?? envelope.data) as T;
  }

  return response as T;
};

const attemptEndpoints = async <T>(
  endpoints: string[],
  action: (endpoint: string) => Promise<T>
): Promise<T> => {
  for (const endpoint of endpoints) {
    try {
      return await action(endpoint);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Payments API route not found. Tried: ${endpoints.join(', ')}`);
};

export const paymongoService = {
  createPaymentIntent: async (payload: {
    booking_id?: number | string;
    amount: number;
    currency: string;
    description: string;
    return_url?: string;
    [key: string]: unknown;
  }): Promise<PaymentIntentResponse> => {
    const endpoints = ['/payments/intents', '/api/payments/intents'];
    return attemptEndpoints(endpoints, async (endpoint) => {
      const response = await api.post<ApiEnvelope<PaymentIntentResponse> | PaymentIntentResponse>(
        endpoint,
        payload,
        { requiresAuth: true }
      );
      return unwrapResponse(response);
    });
  },

  attachPaymentMethod: async (
    intentId: string,
    payload: {
      payment_method_id: string;
      return_url: string;
    }
  ): Promise<PaymentIntentResponse> => {
    const endpoints = [
      `/payments/intents/${intentId}/attach`,
      `/api/payments/intents/${intentId}/attach`,
    ];
    return attemptEndpoints(endpoints, async (endpoint) => {
      const response = await api.post<ApiEnvelope<PaymentIntentResponse> | PaymentIntentResponse>(
        endpoint,
        payload,
        { requiresAuth: true }
      );
      return unwrapResponse(response);
    });
  },
  

  createPaymentLink: async (payload: {
    booking_id?: number | string;
    amount: number;
    currency: string;
    description: string;
    return_url?: string;
    [key: string]: unknown;
  }): Promise<PaymentLinkResponse> => {
    const endpoints = ['/payments/links', '/api/payments/links'];
    return attemptEndpoints(endpoints, async (endpoint) => {
      const response = await api.post<ApiEnvelope<PaymentLinkResponse> | PaymentLinkResponse>(
        endpoint,
        payload,
        { requiresAuth: true }
      );
      const paymentLink = unwrapResponse(response);
      const checkoutUrl = paymentLink.checkout_url || paymentLink.attributes?.checkout_url;

      if (!checkoutUrl) {
        throw new Error('PayMongo did not return a checkout URL.');
      }

      return {
        ...paymentLink,
        checkout_url: checkoutUrl,
      };
    });
  },

  createAddonPaymentLink: async (payload: {
    booking_id: number | string;
    addons: Array<{
      provider_id: number;
      service_type: string;
      provider_name_snapshot: string;
      provider_rate_snapshot: number;
      quote_required?: boolean;
      duration_minutes?: number;
    }>;
    amount: number;
    currency: string;
    description: string;
    return_url?: string;
    [key: string]: unknown;
  }): Promise<PaymentLinkResponse> => {
    const endpoints = ['/payments/addons/links', '/api/payments/addons/links'];
    return attemptEndpoints(endpoints, async (endpoint) => {
      const response = await api.post<ApiEnvelope<PaymentLinkResponse> | PaymentLinkResponse>(
        endpoint,
        payload,
        { requiresAuth: true }
      );
      const paymentLink = unwrapResponse(response);
      const checkoutUrl = paymentLink.checkout_url || paymentLink.attributes?.checkout_url;

      if (!checkoutUrl) {
        throw new Error('PayMongo did not return a checkout URL.');
      }

      return {
        ...paymentLink,
        checkout_url: checkoutUrl,
      };
    });
  },

  syncPaymentLink: async (linkId: string): Promise<PaymentLinkSyncResponse> => {
    const endpoints = [
      `/payments/links/${linkId}/sync`,
      `/api/payments/links/${linkId}/sync`,
    ];
    return attemptEndpoints(endpoints, async (endpoint) => {
      return api.post<PaymentLinkSyncResponse>(
        endpoint,
        {},
        { requiresAuth: true }
      );
    });
  },
};

export default paymongoService;
