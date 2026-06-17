"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { APIError } from '@/network';
import cartService, { CartItemResponse } from '@/network/services/cartService';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/lib/toastContext';

export interface CartItem {
  id: string;
  serverItemId?: number;
  time: string;
  name: string;
  duration: string;
  price: string;
  // Additional booking details
  bookingType?: 'professional_slots' | 'whole_studio';
  bookingDate?: string; // YYYY-MM-DD format
  timeSlotId?: string; // UUID for time slot
  serviceProviderId?: number;
  serviceType?: string;
  serviceProviderName?: string;
  serviceProviderRate?: number;
  serviceAddons?: ServiceAddon[];
}

export interface ServiceAddon {
  providerId: number;
  serviceType: string;
  providerName: string;
  providerRate: number;
  quoteRequired?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
   updateItem: (updatedItem: CartItem) => void;
  attachServiceToLatestSlot: (service: { providerId: number; serviceType: string; providerName: string; providerRate?: number; quoteRequired?: boolean; updatedPrice?: string }) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCartItemKey = (item: CartItem) =>
  `${item.timeSlotId || item.id}__${item.bookingDate || ""}__${item.bookingType || ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, token, user } = useAuth();
  const { showToast } = useToast();

  const redirectToLogin = useCallback(() => {
    if (typeof window === 'undefined') return;
    const nextPath = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/pages/Auth/login?next=${encodeURIComponent(nextPath)}`;
  }, []);

  const updateItem = (updatedItem: CartItem) => {
  setItems(prev => prev.map(it => it.id === updatedItem.id ? updatedItem : it));
};

  const mapApiItemToCartItem = useCallback((item: CartItemResponse): CartItem => {
    const displayTime = item.time_slots?.display_time || item.time_slot_id;
    const bookingType = item.time_slots?.booking_type || 'professional_slots';
    const priceNumber = item.line_total ?? item.price_at_time;

    return {
      id: `cart-item-${item.id}`,
      serverItemId: item.id,
      time: displayTime,
      name: bookingType === 'whole_studio' ? 'STUDIO RENTAL' : 'PROFESSIONAL SESSION',
      duration: '55 MIN',
      price: `₱${Number(priceNumber || 0).toLocaleString()}`,
      bookingType,
      bookingDate: item.booking_date,
      timeSlotId: item.time_slot_id,
    };
  }, []);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated()) {
      setItems([]);
      return;
    }

    try {
      const cart = await cartService.getCart();
      const mappedItems = (cart?.items || []).map(mapApiItemToCartItem);
      setItems(mappedItems);
    } catch {
      setItems([]);
    }
  }, [isAuthenticated, mapApiItemToCartItem]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCart();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCart, token, user?.id]);

  const addItem = async (item: CartItem) => {
    const hasServerPayload = Boolean(item.timeSlotId && item.bookingDate);
    const optimisticId = `pending-${item.id}-${Date.now()}`;
    const optimisticItem = { ...item, id: optimisticId };

    if (!isAuthenticated()) {
      showToast('Please log in to add items to cart.', 'error');
      redirectToLogin();
      return;
    }

    if (!hasServerPayload) {
      setItems(prevItems => [...prevItems, { ...item, id: `${item.id}-${Date.now()}` }]);
      showToast('Item added to cart.', 'success');
      return;
    }

    setItems(prevItems => {
      const incomingKey = getCartItemKey(item);
      const alreadyExists = prevItems.some(existing => getCartItemKey(existing) === incomingKey);
      return alreadyExists ? prevItems : [...prevItems, optimisticItem];
    });
    showToast('Item added to cart.', 'success');

    try {
      const cart = await cartService.addItem({
        time_slot_id: item.timeSlotId!,
        booking_date: item.bookingDate!,
        quantity: 1,
      });

      const mappedItems = (cart?.items || []).map(mapApiItemToCartItem);
      setItems(mappedItems);
    } catch (error) {
      if (error instanceof APIError && error.status === 401) {
        setItems(prevItems => prevItems.filter(existing => existing.id !== optimisticId));
        showToast('Session expired. Please log in again.', 'error');
        redirectToLogin();
        return;
      }

      setItems(prevItems => prevItems.filter(existing => existing.id !== optimisticId));
      showToast('Unable to add item to server cart. Added locally instead.', 'error');
    }
  };

  const attachServiceToLatestSlot = async (service: { providerId: number; serviceType: string; providerName: string; providerRate?: number; quoteRequired?: boolean; updatedPrice?: string }) => {
    let updated = false;

    setItems(prevItems => {
      const targetIndex = [...prevItems].reverse().findIndex(item => Boolean(item.timeSlotId));
      if (targetIndex === -1) return prevItems;

      const actualIndex = prevItems.length - 1 - targetIndex;
      const nextItems = [...prevItems];
      const nextAddon = {
        providerId: service.providerId,
        serviceType: service.serviceType,
        providerName: service.providerName,
        providerRate: service.providerRate ?? 0,
        quoteRequired: service.quoteRequired,
      };
      const serviceAddons = [
        ...(nextItems[actualIndex].serviceAddons || []).filter((addon) => addon.serviceType !== service.serviceType),
        nextAddon,
      ];
      nextItems[actualIndex] = {
        ...nextItems[actualIndex],
        serviceProviderId: service.providerId,
        serviceType: service.serviceType,
        serviceProviderName: service.providerName,
        serviceProviderRate: service.providerRate,
        serviceAddons,
      };
      updated = true;
      return nextItems;
    });

    if (updated) {
      showToast('Service attached to selected booking.', 'success');
      return true;
    }

    showToast('No slot booking found to attach this service.', 'error');
    return false;
  };

  const updateItemQuantity = async (id: string, quantity: number) => {
    const targetItem = items.find(item => item.id === id);
    if (!targetItem) return;

    if (targetItem.serverItemId && isAuthenticated()) {
      try {
        await cartService.updateItemQuantity(targetItem.serverItemId, quantity);
        await loadCart();
        if (quantity <= 0) {
          showToast('Item removed from cart.', 'info');
        }
        return;
      } catch {
        showToast('Unable to update item quantity.', 'error');
      }
    }

    if (quantity <= 0) {
      setItems(prevItems => prevItems.filter((item) => item.id !== id));
      showToast('Item removed from cart.', 'info');
    }
  };

  const removeItem = async (id: string) => {
    const targetItem = items.find(item => item.id === id);
    if (targetItem?.serverItemId && isAuthenticated()) {
      setItems(prevItems => prevItems.filter((item) => item.id !== id));
      showToast('Item removed from cart.', 'info');

      try {
        await cartService.removeItem(targetItem.serverItemId);
        return;
      } catch {
        setItems(prevItems => {
          const alreadyRestored = prevItems.some(item => item.id === targetItem.id);
          return alreadyRestored ? prevItems : [...prevItems, targetItem];
        });
        showToast('Unable to remove item from server cart.', 'error');
      }

      return;
    }

    setItems(prevItems => prevItems.filter((item) => item.id !== id));
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = async () => {
    if (isAuthenticated()) {
      try {
        await cartService.clearCart();
        showToast('Cart cleared.', 'info');
      } catch {
        showToast('Unable to clear server cart. Local cart was cleared.', 'error');
      }
    }

    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, updateItem, attachServiceToLatestSlot, removeItem, clearCart, updateItemQuantity, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

