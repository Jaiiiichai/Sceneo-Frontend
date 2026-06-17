# Closed Dates API Integration

This document explains how the closed dates management is integrated in the admin dashboard.

## API Endpoints

### 1. Get Closed Dates
```
GET http://localhost:4000/api/closed-dates
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "closed_date": "2026-02-25",
      "reason": "Company Holiday",
      "created_at": "2026-02-17T12:47:51.185392"
    }
  ]
}
```

### 2. Close a Date (Admin Only - Requires Auth Token)
```
POST http://localhost:4000/api/closed-dates
Authorization: Bearer <token>
Content-Type: application/json

{
  "closed_date": "2026-02-25"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Date closed successfully",
  "data": {
    "id": 1,
    "closed_date": "2026-02-25",
    "created_at": "2026-02-17T12:47:51.185392"
  }
}
```

### 3. Open a Date (Delete Closed Date)
```
DELETE http://localhost:4000/api/closed-dates/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Date opened successfully"
}
```

## Frontend Implementation

### Admin Dashboard
**Location:** [app/admin/dashboard/page.tsx](../app/admin/dashboard/page.tsx)

The admin dashboard has a full calendar interface for managing closed dates:

**Features:**
✅ Fetch closed dates on page load using `GET /api/closed-dates`
✅ Display calendar with green (open) and red (closed) date indicators
✅ Click any future date to toggle availability
✅ Confirmation modal before closing/opening dates
✅ API integration with authentication token for both POST and DELETE
✅ Loading state during API calls
✅ Success/error toast notifications
✅ List of currently closed dates below calendar
✅ Properly opens dates using DELETE endpoint by ID

**Key Functions:**

```typescript
// Fetch closed dates from API
const fetchClosedDates = async () => {
  try {
    const result = await api.get('/closed-dates');
    if (result.success && result.data) {
      const dates = result.data.map((item: any) => item.closed_date);
      setClosedDates(dates);
    }
  } catch (error) {
  }
};

// Close a date
const confirmToggle = async () => {
  const { date, action } = confirmModal;
  
  if (action === 'close') {
    const result = await api.post('/closed-dates', 
      { closed_date: date },
      { requiresAuth: true }
    );
    
    if (result.success && result.data) {
      setClosedDates([...closedDates, result.data]);
    }
  } else if (action === 'open') {
    const closedDateObj = closedDates.find(cd => cd.closed_date === date);
    if (closedDateObj) {
      const result = await api.delete(`/closed-dates/${closedDateObj.id}`, 
        { requiresAuth: true }
      );
      
      if (result.success) {
        setClosedDates(closedDates.filter(cd => cd.id !== closedDateObj.id));
      }
    }
  }
};
```

### Customer DateSelector
**Location:** [components/DateSelector.tsx](../components/DateSelector.tsx)

The customer-facing date selector automatically disables closed dates:

**Features:**
✅ Fetch closed dates on component mount
✅ Disable closed dates (grayed out, cannot click)
✅ Show "Closed" label on disabled dates
✅ Strikethrough styling for closed dates

**Implementation:**

```typescript
// Fetch closed dates
useEffect(() => {
  const fetchClosedDates = async () => {
    try {
      const result = await api.get('/closed-dates');
      
      if (result.success && result.data) {
        const dates = result.data.map((item: ClosedDate) => item.closed_date);
        setClosedDates(dates);
      }
    } catch (error) {
    }
  };

  fetchClosedDates();
}, []);

// Check if date is closed
const isClosed = (date: Date) => {
  const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  return closedDates.includes(dateString);
};
```

## How to Use (Admin)

### Accessing Admin Dashboard
1. Navigate to `/admin/dashboard`
2. Must be logged in as admin (token stored in localStorage)
3. Click on "Availability" tab

### Closing a Date
1. View the calendar in the Availability tab
2. Click on any future date (green = open, red = closed)
3. Confirm the action in the modal
4. The date will be sent to the backend API
5. Success notification will appear
6. Calendar updates to show the date as closed
7. Customer date selectors will automatically show it as disabled

### Opening a Date
1. Click on a red (closed) date
2. Confirm opening the date
3. System calls DELETE /api/closed-dates/:id with the record ID
4. Success notification will appear
5. Calendar updates to show the date as open (green)
6. Customer date selectors will automatically allow the date

## Backend Requirements

### Current Status
✅ GET /api/closed-dates - **Implemented**
✅ POST /api/closed-dates - **Implemented**
✅ DELETE /api/closed-dates/:id - **Implemented**

### DELETE Endpoint Specification
```
DELETE http://localhost:4000/api/closed-dates/:id
Authorization: Bearer <token>
```

Where `:id` is the closed date record ID (integer), not the date string.

**Expected Response:**
```json
{
  "success": true,
  "message": "Date opened successfully"
}
```

## Authentication

The API uses Bearer token authentication:

```typescript
// Token is automatically included when using api.post()
const result = await api.post('/closed-dates', 
  { closed_date: date },
  { requiresAuth: true }  // This adds Authorization header
);
```

Token is retrieved from:
1. `useAuth()` context (React state)
2. `localStorage.getItem('authToken')` (fallback)
3. Automatically added to request headers in `network/index.ts`

## Date Format

All dates use **ISO 8601 format**: `YYYY-MM-DD`

Examples:
- `2026-02-25` (February 25, 2026)
- `2026-12-25` (December 25, 2026)

## Error Handling

```typescript
try {
  const result = await api.post('/closed-dates', { closed_date: date });
  
  if (result.success) {
    // Success
    showConfirmation('Date closed successfully', 'success');
  } else {
    // API returned error
    showConfirmation('Failed to close date', 'error');
  }
} catch (error) {
  // Network or other error
  showConfirmation('An error occurred', 'error');
}
```

## Testing

### Test Closing a Date
1. Login to admin dashboard
2. Go to Availability tab
3. Click on Feb 25, 2026
4. Confirm closing
5. Check browser Network tab for POST request
6. Verify response is successful
7. Open customer booking page
8. Verify Feb 25 is disabled and shows "Closed"

### Test API Directly
```bash
# Get closed dates (no auth required)
curl http://localhost:4000/api/closed-dates

# Close a date (requires auth token)
curl -X POST http://localhost:4000/api/closed-dates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"closed_date": "2026-03-15"}'
```

## Future Enhancements

- [ ] Add reason field to close date form
- [ ] Add bulk close/open functionality (e.g., close all Mondays)
- [ ] Add date range closing
- [ ] Export closed dates to CSV
- [ ] Email notifications when dates are closed
- [ ] Recurring closed dates (e.g., every Sunday)
