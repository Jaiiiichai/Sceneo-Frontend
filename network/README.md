# Network API Configuration

This folder contains centralized API configuration for the application.

## Setup

### 1. Configure Environment Variables

Create a `.env.local` file in the root directory and add:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**Note:** For Next.js, environment variables that need to be accessible in the browser must be prefixed with `NEXT_PUBLIC_`.

### 2. Environment-Specific URLs

- **Development:** `http://localhost:8000/api`
- **Staging:** `https://staging-api.yourdomain.com/api`
- **Production:** `https://api.yourdomain.com/api`

## Usage Examples

### Basic GET Request

```typescript
import api, { API_ENDPOINTS } from '@/network';

// Fetch list of studios
const studios = await api.get(API_ENDPOINTS.studios.list);
```

### GET with Query Parameters

```typescript
import api, { API_ENDPOINTS } from '@/network';

// Fetch studios with filters
const studios = await api.get(API_ENDPOINTS.studios.list, {
  params: {
    city: 'New York',
    capacity: 10,
    available: true,
  },
});
```

### POST Request

```typescript
import api, { API_ENDPOINTS } from '@/network';

// Create a booking
const booking = await api.post(API_ENDPOINTS.bookings.create, {
  studioId: '123',
  date: '2026-02-20',
  timeSlot: '10:00-12:00',
});
```

### Authenticated Requests

```typescript
import api, { API_ENDPOINTS } from '@/network';

// Fetch user profile (requires authentication)
const profile = await api.get(API_ENDPOINTS.user.profile, {
  requiresAuth: true,
});
```

### PUT/PATCH Request

```typescript
import api, { API_ENDPOINTS } from '@/network';

// Update user profile
const updatedProfile = await api.put(
  API_ENDPOINTS.user.update,
  {
    name: 'John Doe',
    phone: '+1234567890',
  },
  { requiresAuth: true }
);
```

### DELETE Request

```typescript
import api, { API_ENDPOINTS } from '@/network';

// Cancel a booking
await api.delete(
  API_ENDPOINTS.bookings.cancel('booking-id-123'),
  { requiresAuth: true }
);
```

### File Upload

```typescript
import api from '@/network';

// Upload profile picture
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'avatar');

const response = await api.upload('/user/avatar', formData, {
  requiresAuth: true,
});
```

### Error Handling

```typescript
import api, { APIError } from '@/network';

try {
  const data = await api.get('/some-endpoint');
} catch (error) {
  if (error instanceof APIError) {
    
    // Handle specific status codes
    if (error.status === 401) {
      // Redirect to login
    } else if (error.status === 404) {
      // Show not found message
    }
  } else {
  }
}
```

### React Component Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import api, { API_ENDPOINTS, APIError } from '@/network';

interface Studio {
  id: string;
  name: string;
  location: string;
}

export default function StudioList() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStudios() {
      try {
        const data = await api.get<Studio[]>(API_ENDPOINTS.studios.list);
        setStudios(data);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('Failed to load studios');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchStudios();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {studios.map(studio => (
        <div key={studio.id}>{studio.name}</div>
      ))}
    </div>
  );
}
```

### Custom API Service Example

Create specific service files for different features:

```typescript
// network/services/bookingService.ts
import api, { API_ENDPOINTS } from '@/network';

interface CreateBookingData {
  studioId: string;
  date: string;
  timeSlot: string;
  professionalId?: string;
}

export const bookingService = {
  createBooking: async (data: CreateBookingData) => {
    return api.post(API_ENDPOINTS.bookings.create, data, {
      requiresAuth: true,
    });
  },

  getMyBookings: async () => {
    return api.get(API_ENDPOINTS.user.bookings, {
      requiresAuth: true,
    });
  },

  cancelBooking: async (bookingId: string) => {
    return api.delete(API_ENDPOINTS.bookings.cancel(bookingId), {
      requiresAuth: true,
    });
  },
};
```

## API Configuration

### Adding New Endpoints

To add new endpoints, update the `API_ENDPOINTS` object in `network/index.ts`:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  
  // New feature endpoints
  reviews: {
    list: '/reviews',
    create: '/reviews',
    details: (id: string) => `/reviews/${id}`,
  },
};
```

### Custom Headers

Add custom headers to specific requests:

```typescript
const data = await api.get('/endpoint', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Authentication Token

The API automatically reads the auth token from `localStorage` with key `authToken`. To set the token after login:

```typescript
// After successful login
localStorage.setItem('authToken', token);

// To remove token on logout
localStorage.removeItem('authToken');
```

## TypeScript Types

Define response types for better type safety:

```typescript
// types/api.ts
export interface Studio {
  id: string;
  name: string;
  location: string;
  capacity: number;
  price: number;
}

export interface Booking {
  id: string;
  studioId: string;
  userId: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Usage
import { Studio } from '@/types/api';
const studios = await api.get<Studio[]>(API_ENDPOINTS.studios.list);
```

## Testing

You can test the API configuration without a backend by mocking responses:

```typescript
// For testing only - mock the api
jest.mock('@/network', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
  API_ENDPOINTS: {
    studios: {
      list: '/studios',
    },
  },
}));
```
