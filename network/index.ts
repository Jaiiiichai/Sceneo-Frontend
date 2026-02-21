/**
 * API Configuration
 * Centralized API setup for the application
 */

// API Base URL - Change this based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
  },
  // Booking endpoints
  bookings: {
    create: '/bookings',
    list: '/bookings',
    details: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
  },
  // Studio endpoints
  studios: {
    list: '/studios',
    details: (id: string) => `/studios/${id}`,
    availability: (id: string) => `/studios/${id}/availability`,
  },
  // Professional endpoints
  professionals: {
    list: '/professionals',
    details: (id: string) => `/professionals/${id}`,
    availability: (id: string) => `/professionals/${id}/availability`,
  },
  // User endpoints
  user: {
    profile: '/user/profile',
    update: '/user/profile',
    bookings: '/user/bookings',
  },
  // Availability endpoints
  availability: {
    closedDates: '/closed-dates',
    slots: '/slots',
    inventory: '/slot-inventory',
  },
  // Time slots endpoints
  timeSlots: {
    list: '/time-slots',
  },
  carts: {
    get: '/carts',
    addItem: '/carts/items',
    updateItem: (itemId: number | string) => `/carts/items/${itemId}`,
    removeItem: (itemId: number | string) => `/carts/items/${itemId}`,
    clear: '/carts/clear',
  },
};

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Request configuration options
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  requiresAuth?: boolean;
}

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

/**
 * Build URL with query parameters
 */
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  if (!params) return url;
  
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * Main API request function
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, requiresAuth = false, headers = {}, ...fetchOptions } = options;

  // Build URL with query parameters
  const url = buildUrl(endpoint, params);

  // Setup headers
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Add authorization header if required
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Parse response
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    // Handle errors
    if (!response.ok) {
      throw new APIError(
        data?.message || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    // Re-throw APIError as is
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new APIError('Network error. Please check your connection.', 0);
    }

    // Handle other errors
    throw new APIError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

/**
 * Exported API methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  /**
   * Upload file(s)
   */
  upload: <T = any>(endpoint: string, formData: FormData, options?: RequestOptions) => {
    const { headers, ...restOptions } = options || {};
    return apiRequest<T>(endpoint, {
      ...restOptions,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        ...headers,
        'Content-Type': undefined,
      } as any,
    });
  },
};

/**
 * Export base URL for direct use if needed
 */
export { API_BASE_URL };

export default api;
