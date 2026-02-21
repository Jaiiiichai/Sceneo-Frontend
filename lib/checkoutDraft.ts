'use client';

import { CartItem } from '@/lib/cartContext';

const CHECKOUT_DRAFT_KEY = 'checkoutDirectDraft';

export const getCheckoutDraft = (): CartItem | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CartItem;
  } catch {
    return null;
  }
};

export const setCheckoutDraft = (item: CartItem) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(item));
};

export const clearCheckoutDraft = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
};
