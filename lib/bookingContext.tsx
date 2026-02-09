'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type BookingType = 'whole_studio' | 'slot';

interface BookingContextType {
  bookingType: BookingType;
  setBookingType: (type: BookingType) => void;
}

const BookingTypeContext = createContext<BookingContextType | undefined>(undefined);

export function BookingTypeProvider({ children }: { children: ReactNode }) {
  const [bookingType, setBookingType] = useState<BookingType>('slot'); // Default to 'slot'

  return (
    <BookingTypeContext.Provider value={{ bookingType, setBookingType }}>
      {children}
    </BookingTypeContext.Provider>
  );
}

export function useBookingType() {
  const context = useContext(BookingTypeContext);
  if (context === undefined) {
    throw new Error('useBookingType must be used within a BookingTypeProvider');
  }
  return context;
}
