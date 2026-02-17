/**
 * Studio Service
 * Handles all studio-related API calls
 */

import api, { API_ENDPOINTS } from '../index';

export interface Studio {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  capacity: number;
  price: number;
  amenities: string[];
  images: string[];
  rating: number;
  available: boolean;
}

export interface StudioListParams {
  city?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

export interface AvailabilityParams {
  date: string;
}

export const studioService = {
  /**
   * Get list of studios with optional filters
   */
  getStudios: async (params?: StudioListParams): Promise<Studio[]> => {
    return api.get<Studio[]>(API_ENDPOINTS.studios.list, { params });
  },

  /**
   * Get studio details by ID
   */
  getStudioById: async (studioId: string): Promise<Studio> => {
    return api.get<Studio>(API_ENDPOINTS.studios.details(studioId));
  },

  /**
   * Get studio availability for a specific date
   */
  getStudioAvailability: async (
    studioId: string,
    params: AvailabilityParams
  ): Promise<TimeSlot[]> => {
    return api.get<TimeSlot[]>(
      API_ENDPOINTS.studios.availability(studioId),
      { params }
    );
  },
};

export default studioService;
