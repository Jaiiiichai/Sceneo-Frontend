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
  quantity?: number;
  unitPrice?: number;
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
  durationMinutes?: number;
  startOffsetMinutes?: number;
  requestOnly?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  updateItem: (updatedItem: CartItem) => Promise<void>;
  attachServiceToLatestSlot: (service: { providerId: number; serviceType: string; providerName: string; providerRate?: number; quoteRequired?: boolean; updatedPrice?: string; durationMinutes?: number; startOffsetMinutes?: number }) => Promise<boolean>;
  attachServicesToLatestSlot: (services: ServiceAddon[], replaceServiceTypes?: string[]) => Promise<boolean>;
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

  const updateItem = async (updatedItem: CartItem) => {
    const previousItems = items;
    setItems(prev => prev.map(it => it.id === updatedItem.id ? updatedItem : it));

    if (!updatedItem.serverItemId || !isAuthenticated()) return;

    try {
      const cart = await cartService.updateItem(updatedItem.serverItemId, {
        addons: updatedItem.serviceAddons || [],
      });
      if (cart?.items) {
        setItems(cart.items.map(mapApiItemToCartItem));
      }
    } catch {
      setItems(previousItems);
      showToast('Unable to update add-ons in cart.', 'error');
    }
  };

  const mapApiItemToCartItem = useCallback((item: CartItemResponse): CartItem => {
    const displayTime = item.time_slots?.display_time || item.time_slot_id;
    const bookingType = item.time_slots?.booking_type || 'professional_slots';
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.price_at_time || 0);
    const priceNumber = item.line_total ?? unitPrice * quantity;

    return {
      id: `cart-item-${item.id}`,
      serverItemId: item.id,
      time: displayTime,
      name: bookingType === 'whole_studio' ? 'STUDIO RENTAL' : 'PROFESSIONAL SESSION',
      duration: '60 MIN',
      price: `₱${Number(priceNumber || 0).toLocaleString()}`,
      quantity,
      unitPrice,
      bookingType,
      bookingDate: item.booking_date,
      timeSlotId: item.time_slot_id,
      serviceAddons: item.addons?.map((addon) => ({
        providerId: Number(addon.providerId || 0),
        serviceType: addon.serviceType || '',
        providerName: addon.providerName || '',
        providerRate: Number(addon.providerRate || 0),
        quoteRequired: Boolean(addon.quoteRequired),
        durationMinutes: addon.durationMinutes ?? undefined,
        startOffsetMinutes: addon.startOffsetMinutes ?? undefined,
        requestOnly: Boolean(addon.requestOnly),
      })).filter((addon) => addon.serviceType && addon.providerName),
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
      const existingIndex = prevItems.findIndex(existing => getCartItemKey(existing) === incomingKey);
      if (existingIndex === -1) {
        return [...prevItems, { ...optimisticItem, quantity: 1, unitPrice: parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0 }];
      }

      return prevItems.map((existing, index) => {
        if (index !== existingIndex) return existing;

        const nextQuantity = Number(existing.quantity || 1) + 1;
        const unitPrice = existing.unitPrice ?? (parseFloat(existing.price.replace(/[^0-9.]/g, '')) || 0);
        return {
          ...existing,
          serviceProviderId: item.serviceProviderId ?? existing.serviceProviderId,
          serviceType: item.serviceType ?? existing.serviceType,
          serviceProviderName: item.serviceProviderName ?? existing.serviceProviderName,
          serviceProviderRate: item.serviceProviderRate ?? existing.serviceProviderRate,
          serviceAddons: item.serviceAddons?.length ? item.serviceAddons : existing.serviceAddons,
          quantity: nextQuantity,
          unitPrice,
          price: `₱${(unitPrice * nextQuantity).toLocaleString()}`,
        };
      });
    });
    showToast('Item added to cart.', 'success');

    try {
      const cart = await cartService.addItem({
        time_slot_id: item.timeSlotId!,
        booking_date: item.bookingDate!,
        quantity: 1,
        addons: item.serviceAddons,
      });

      const mappedItems = (cart?.items || []).map(mapApiItemToCartItem);
      const incomingKey = getCartItemKey(item);
      setItems((previousItems) => mappedItems.map((mappedItem) => {
        const mappedKey = getCartItemKey(mappedItem);
        const previousMatch = previousItems.find((previousItem) => getCartItemKey(previousItem) === mappedKey);
        const source = mappedKey === incomingKey ? item : previousMatch;

        if (!source) return mappedItem;

        return {
          ...mappedItem,
          serviceProviderId: source.serviceProviderId,
          serviceType: source.serviceType,
          serviceProviderName: source.serviceProviderName,
          serviceProviderRate: source.serviceProviderRate,
          serviceAddons: source.serviceAddons,
        };
      }));
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

  const attachServicesToLatestSlot = async (services: ServiceAddon[], replaceServiceTypes?: string[]) => {
    let updated = false;

    setItems(prevItems => {
      const targetIndex = [...prevItems].reverse().findIndex(item => Boolean(item.timeSlotId));
      if (targetIndex === -1 || services.length === 0) return prevItems;

      const actualIndex = prevItems.length - 1 - targetIndex;
      const nextItems = [...prevItems];
      const typesToReplace = replaceServiceTypes || services.map(service => service.serviceType);
      const serviceAddons = [
        ...(nextItems[actualIndex].serviceAddons || []).filter((addon) => !typesToReplace.includes(addon.serviceType)),
        ...services,
      ];
      const primaryAddon = services[0];
      nextItems[actualIndex] = {
        ...nextItems[actualIndex],
        serviceProviderId: primaryAddon.providerId,
        serviceType: primaryAddon.serviceType,
        serviceProviderName: primaryAddon.providerName,
        serviceProviderRate: primaryAddon.providerRate,
        serviceAddons,
      };
      updated = true;
      return nextItems;
    });

    if (updated) {
      showToast(services.length > 1 ? 'Services attached to selected booking.' : 'Service attached to selected booking.', 'success');
      return true;
    }

    showToast('No slot booking found to attach this service.', 'error');
    return false;
  };

  const attachServiceToLatestSlot = async (service: { providerId: number; serviceType: string; providerName: string; providerRate?: number; quoteRequired?: boolean; updatedPrice?: string; durationMinutes?: number; startOffsetMinutes?: number }) => (
    attachServicesToLatestSlot([
      {
        providerId: service.providerId,
        serviceType: service.serviceType,
        providerName: service.providerName,
        providerRate: service.providerRate ?? 0,
        quoteRequired: service.quoteRequired,
        durationMinutes: service.durationMinutes,
        startOffsetMinutes: service.startOffsetMinutes,
      },
    ])
  );

  const updateItemQuantity = async (id: string, quantity: number) => {
    const targetItem = items.find(item => item.id === id);
    if (!targetItem) return;
    const previousItem = targetItem;
    const previousItems = items;

    const applyQuantity = (item: CartItem, nextQuantity: number): CartItem => {
      const unitPrice = item.unitPrice ?? (parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0) / Math.max(1, Number(item.quantity || 1));
      return {
        ...item,
        quantity: nextQuantity,
        unitPrice,
        price: `₱${(unitPrice * nextQuantity).toLocaleString()}`,
      };
    };

    if (quantity <= 0) {
      setItems(prevItems => prevItems.filter((item) => item.id !== id));
    } else {
      setItems(prevItems => prevItems.map((item) => (
        item.id === id ? applyQuantity(item, quantity) : item
      )));
    }

    if (targetItem.serverItemId && isAuthenticated()) {
      try {
        const cart = await cartService.updateItemQuantity(targetItem.serverItemId, quantity);
        if (cart?.items) {
          const mappedItems = cart.items.map(mapApiItemToCartItem);
          setItems(mappedItems.map((mappedItem) => {
            const previousMatch = previousItems.find((item) => getCartItemKey(item) === getCartItemKey(mappedItem));
            if (!previousMatch) return mappedItem;

            return {
              ...mappedItem,
              serviceProviderId: previousMatch.serviceProviderId,
              serviceType: previousMatch.serviceType,
              serviceProviderName: previousMatch.serviceProviderName,
              serviceProviderRate: previousMatch.serviceProviderRate,
              serviceAddons: previousMatch.serviceAddons,
            };
          }));
        }
        if (quantity <= 0) {
          showToast('Item removed from cart.', 'info');
        }
        return;
      } catch {
        setItems(previousItems);
        showToast('Unable to update item quantity.', 'error');
        return;
      }
    }

    if (quantity <= 0) {
      showToast('Item removed from cart.', 'info');
      return;
    }

    setItems(prevItems => prevItems.map((item) => (
      item.id === id ? applyQuantity(previousItem, quantity) : item
    )));
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
    <CartContext.Provider value={{ items, addItem, updateItem, attachServiceToLatestSlot, attachServicesToLatestSlot, removeItem, clearCart, updateItemQuantity, isOpen, setIsOpen }}>
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

