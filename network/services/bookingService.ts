/**
 * Booking Service
 * Handles all booking-related API calls
 */

import api, { API_ENDPOINTS } from '../index';

export interface CreateBookingData {
  studioId?: string;
  professionalId?: string;
  date: string;
  timeSlot: string;
  bookingType: 'studio' | 'professional';
  notes?: string;
}

export interface Booking {
  id: string;
  userId: string;
  studioId?: string;
  professionalId?: string;
  date: string;
  timeSlot: string;
  bookingType: 'studio' | 'professional';
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed';
  booking_status?: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingListParams {
  status?: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const bookingService = {
  /**
   * Create a new booking
   */
  createBooking: async (data: CreateBookingData): Promise<Booking> => {
    return api.post<Booking>(API_ENDPOINTS.bookings.create, data, {
      requiresAuth: true,
    });
  },

  /**
   * Get list of bookings with optional filters
   */
  getBookings: async (params?: BookingListParams): Promise<Booking[]> => {
    return api.get<Booking[]>(API_ENDPOINTS.bookings.list, {
      params,
      requiresAuth: true,
    });
  },

  /**
   * Get booking details by ID
   */
  getBookingById: async (bookingId: string): Promise<Booking> => {
    const response = await api.get<unknown>(API_ENDPOINTS.bookings.details(bookingId), {
      requiresAuth: true,
    });

    const booking = response && typeof response === 'object' && 'data' in response
      ? (response as { data?: Booking }).data
      : (response as Booking);

    if (!booking) {
      throw new Error('Booking not found.');
    }

    return {
      ...booking,
      status: booking.status ?? booking.booking_status ?? 'pending',
    };
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string): Promise<Booking> => {
    return api.delete<Booking>(API_ENDPOINTS.bookings.cancel(bookingId), {
      requiresAuth: true,
    });
  },

  /**
   * Get user's bookings
   */
  getMyBookings: async (): Promise<Booking[]> => {
    return api.get<Booking[]>(API_ENDPOINTS.user.bookings, {
      requiresAuth: true,
    });
  },
};

export default bookingService;
