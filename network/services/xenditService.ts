import api, { API_BASE_URL, APIError } from '../index';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  description?: string;
  invoice_url: string;
  expiry_date?: string;
  currency?: string;
  metadata?: {
    booking_id?: number | string;
    user_id?: number | string;
  };
}

export interface FinalizedBooking {
  id: number | string;
  user_id?: number | string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  booking_type?: string;
  booking_date?: string;
  booking_time?: string;
  booking_status?: string;
  booking_price?: number | string;
  service_type?: string | null;
  service_provider_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const xenditService = {
  createInvoice: async (bookingId: number | string): Promise<XenditInvoice> => {
    const MAX_INT32 = 2147483647;
    const normalizedBookingId = typeof bookingId === 'number' ? bookingId : Number(bookingId);

    if (!Number.isInteger(normalizedBookingId) || normalizedBookingId <= 0 || normalizedBookingId > MAX_INT32) {
      throw new Error('Invalid booking_id. Payments API requires a positive 32-bit integer booking ID.');
    }

    const createEndpoints = [
      '/payments/invoices',
      '/api/payments/invoices',
      '/payment/invoices',
      '/payments/invoice',
      '/api/payment/invoices',
      '/api/payments/invoice',
    ];

    for (const endpoint of createEndpoints) {
      try {
        // Add redirect URLs to the payload
        const successUrl = `${window.location.origin}/payment-success?bookingId=${normalizedBookingId}`;
        const failureUrl = `${window.location.origin}/payment-failure?bookingId=${normalizedBookingId}`;
        const response = await api.post<ApiEnvelope<XenditInvoice> | XenditInvoice>(
          endpoint,
          {
            booking_id: normalizedBookingId,
            success_redirect_url: successUrl,
            failure_redirect_url: failureUrl
          },
          { requiresAuth: true }
        );

        if (response && typeof response === 'object' && 'success' in response) {
          if (!response.success || !response.data) {
            throw new Error('Unable to create payment invoice.');
          }
          return response.data;
        }

        return response as XenditInvoice;
      } catch (error) {
        if (error instanceof APIError && error.status === 404) {
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Payments API route not found. Tried: ${createEndpoints.join(', ')}. Current API base URL: ${API_BASE_URL}`
    );
  },

  finalizeInvoice: async (invoiceId: string): Promise<FinalizedBooking> => {
    const finalizeEndpoints = [
      `/payments/invoices/${invoiceId}/finalize`,
      `/api/payments/invoices/${invoiceId}/finalize`,
      `/payment/invoices/${invoiceId}/finalize`,
      `/payments/invoice/${invoiceId}/finalize`,
      `/api/payment/invoices/${invoiceId}/finalize`,
      `/api/payments/invoice/${invoiceId}/finalize`,
    ];

    for (const endpoint of finalizeEndpoints) {
      try {
        const response = await api.post<ApiEnvelope<FinalizedBooking> | FinalizedBooking>(
          endpoint,
          undefined,
          { requiresAuth: true }
        );

        if (response && typeof response === 'object' && 'success' in response) {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Unable to finalize invoice.');
          }
          return response.data;
        }

        return response as FinalizedBooking;
      } catch (error) {
        if (error instanceof APIError && error.status === 404) {
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Payments finalize route not found. Tried: ${finalizeEndpoints.join(', ')}. Current API base URL: ${API_BASE_URL}`
    );
  },

  getInvoice: async (invoiceId: string): Promise<XenditInvoice> => {
    const statusEndpoints = [
      `/payments/invoices/${invoiceId}`,
      `/api/payments/invoices/${invoiceId}`,
      `/payment/invoices/${invoiceId}`,
      `/payments/invoice/${invoiceId}`,
      `/api/payment/invoices/${invoiceId}`,
      `/api/payments/invoice/${invoiceId}`,
    ];

    for (const endpoint of statusEndpoints) {
      try {
        const response = await api.get<ApiEnvelope<XenditInvoice> | XenditInvoice>(
          endpoint,
          { requiresAuth: true }
        );

        if (response && typeof response === 'object' && 'success' in response) {
          if (!response.success || !response.data) {
            throw new Error('Unable to fetch payment invoice status.');
          }
          return response.data;
        }

        return response as XenditInvoice;
      } catch (error) {
        if (error instanceof APIError && error.status === 404) {
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Payments status route not found. Tried: ${statusEndpoints.join(', ')}. Current API base URL: ${API_BASE_URL}`
    );
  },
};

export default xenditService;