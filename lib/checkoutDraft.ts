'use client';

import { CartItem } from '@/lib/cartContext';

const CHECKOUT_DRAFT_KEY = 'checkoutDirectDraft';
const SELECTED_CART_ITEM_IDS_KEY = 'checkoutSelectedCartItemIds';

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
  window.sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY);
};

export const getSelectedCheckoutItemIds = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(SELECTED_CART_ITEM_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const setSelectedCheckoutItemIds = (itemIds: string[]) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SELECTED_CART_ITEM_IDS_KEY, JSON.stringify(itemIds));
  window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
};

export const clearCheckoutDraft = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  window.sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY);
};
