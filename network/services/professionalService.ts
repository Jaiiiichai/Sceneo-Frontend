/**
 * Professional Service
 * Handles all professional-related API calls
 */

import api, { API_ENDPOINTS } from '../index';

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  bio: string;
  portfolio: string[];
  rating: number;
  hourlyRate: number;
  available: boolean;
  avatar: string;
}

export interface ProfessionalListParams {
  specialty?: string;
  minRate?: number;
  maxRate?: number;
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

export const professionalService = {
  /**
   * Get list of professionals with optional filters
   */
  getProfessionals: async (params?: ProfessionalListParams): Promise<Professional[]> => {
    return api.get<Professional[]>(API_ENDPOINTS.professionals.list, { params });
  },

  /**
   * Get professional details by ID
   */
  getProfessionalById: async (professionalId: string): Promise<Professional> => {
    return api.get<Professional>(API_ENDPOINTS.professionals.details(professionalId));
  },

  /**
   * Get professional availability for a specific date
   */
  getProfessionalAvailability: async (
    professionalId: string,
    params: AvailabilityParams
  ): Promise<TimeSlot[]> => {
    return api.get<TimeSlot[]>(
      API_ENDPOINTS.professionals.availability(professionalId),
      { params }
    );
  },
};

export default professionalService;
