export interface PendingPaymentBookingDraft {
  invoiceId?: string;
  invoiceUrl?: string;
  bookingPayload?: Record<string, any>;
  bookingId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'sceneo.pendingPaymentBooking';

export const setPendingPaymentBooking = (draft: PendingPaymentBookingDraft): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
};

export const getPendingPaymentBooking = (): PendingPaymentBookingDraft | null => {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingPaymentBookingDraft;
    if (!parsed) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingPaymentBooking = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
