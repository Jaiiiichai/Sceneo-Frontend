"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
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
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (item: CartItem) => {
    setItems([...items, { ...item, id: `${item.id}-${Date.now()}` }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, isOpen, setIsOpen }}>
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
