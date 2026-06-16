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
  attributes?: {
    checkout_url?: string;
  };
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
    [key: string]: any;
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
    [key: string]: any;
  }): Promise<PaymentLinkResponse> => {
    const endpoints = ['/payments/links', '/api/payments/links'];
    return attemptEndpoints(endpoints, async (endpoint) => {
      const response = await api.post<ApiEnvelope<PaymentLinkResponse> | PaymentLinkResponse>(
        endpoint,
        payload,
        { requiresAuth: true }
      );
      return unwrapResponse(response);
    });
  },
};

export default paymongoService;
