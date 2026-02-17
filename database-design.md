# Database Design for Time Slots & Opening Dates

## Problem
- **Time slots are FIXED** (e.g., 9:00 AM, 10:00 AM, 11:00 AM, etc.)
- **Opening dates are VARIABLE** (studio might be closed some days, open others)

## Solution: Multi-Table Design

### 1. Time Slots Table (Fixed)
Stores all possible time slots that never change.

```sql
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO time_slots (start_time, end_time, duration_minutes) VALUES
    ('09:00:00', '10:00:00', 60),
    ('10:00:00', '11:00:00', 60),
    ('11:00:00', '12:00:00', 60),
    ('13:00:00', '14:00:00', 60),
    ('14:00:00', '15:00:00', 60),
    ('15:00:00', '16:00:00', 60),
    ('16:00:00', '17:00:00', 60);
```

### 2. Operating Hours Table (Weekly Pattern)
Defines which days of the week the studio is normally open.

```sql
CREATE TABLE operating_hours (
    id SERIAL PRIMARY KEY,
    studio_id INTEGER REFERENCES studios(id),
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    is_open BOOLEAN DEFAULT TRUE,
    opening_time TIME,
    closing_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studio_id, day_of_week)
);

-- Example: Studio 1 is open Monday-Friday, 9 AM - 5 PM
INSERT INTO operating_hours (studio_id, day_of_week, is_open, opening_time, closing_time) VALUES
    (1, 1, TRUE, '09:00:00', '17:00:00'), -- Monday
    (1, 2, TRUE, '09:00:00', '17:00:00'), -- Tuesday
    (1, 3, TRUE, '09:00:00', '17:00:00'), -- Wednesday
    (1, 4, TRUE, '09:00:00', '17:00:00'), -- Thursday
    (1, 5, TRUE, '09:00:00', '17:00:00'), -- Friday
    (1, 6, FALSE, NULL, NULL),            -- Saturday - CLOSED
    (1, 0, FALSE, NULL, NULL);            -- Sunday - CLOSED
```

### 3. Special Dates / Exceptions Table (Variable Dates)
Overrides normal operating hours for specific dates (holidays, special events, closures).

```sql
CREATE TABLE special_dates (
    id SERIAL PRIMARY KEY,
    studio_id INTEGER REFERENCES studios(id),
    date DATE NOT NULL,
    is_open BOOLEAN DEFAULT FALSE,
    opening_time TIME,
    closing_time TIME,
    reason VARCHAR(255), -- e.g., "Holiday", "Maintenance", "Special Event"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studio_id, date)
);

-- Example: Close on specific dates
INSERT INTO special_dates (studio_id, date, is_open, reason) VALUES
    (1, '2026-02-20', FALSE, 'Holiday'),
    (1, '2026-03-15', FALSE, 'Maintenance'),
    (1, '2026-04-01', TRUE, 'Special opening on Sunday'); -- Open on a day normally closed
```

### 4. Bookings Table
Stores actual bookings.

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    studio_id INTEGER REFERENCES studios(id),
    booking_date DATE NOT NULL,
    time_slot_id INTEGER REFERENCES time_slots(id),
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studio_id, booking_date, time_slot_id) -- Prevent double booking
);
```

---

## How to Check Availability

### SQL Query to Get Available Slots for a Date

```sql
-- Get available time slots for a specific studio and date
WITH date_info AS (
    SELECT 
        EXTRACT(DOW FROM '2026-02-20'::DATE) AS day_of_week,
        '2026-02-20'::DATE AS check_date
),
normal_hours AS (
    -- Get normal operating hours for this day of week
    SELECT * FROM operating_hours
    WHERE studio_id = 1
    AND day_of_week = (SELECT day_of_week FROM date_info)
),
special_override AS (
    -- Check if there's a special date override
    SELECT * FROM special_dates
    WHERE studio_id = 1
    AND date = (SELECT check_date FROM date_info)
)
SELECT 
    ts.id,
    ts.start_time,
    ts.end_time,
    ts.duration_minutes,
    CASE 
        WHEN b.id IS NOT NULL THEN FALSE -- Already booked
        WHEN so.is_open IS NOT NULL THEN so.is_open -- Special date override
        WHEN nh.is_open IS NOT NULL THEN nh.is_open -- Normal hours
        ELSE FALSE -- Default to closed
    END as is_available
FROM time_slots ts
CROSS JOIN normal_hours nh
LEFT JOIN special_override so ON TRUE
LEFT JOIN bookings b ON b.time_slot_id = ts.id 
    AND b.booking_date = (SELECT check_date FROM date_info)
    AND b.studio_id = 1
    AND b.status != 'cancelled'
WHERE ts.is_active = TRUE
ORDER BY ts.start_time;
```

---

## Alternative Approach: Availability Slots Table

If you want more granular control, create availability slots:

```sql
CREATE TABLE availability_slots (
    id SERIAL PRIMARY KEY,
    studio_id INTEGER REFERENCES studios(id),
    date DATE NOT NULL,
    time_slot_id INTEGER REFERENCES time_slots(id),
    is_available BOOLEAN DEFAULT TRUE,
    max_bookings INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studio_id, date, time_slot_id)
);

-- Generate availability for the next 30 days (run this periodically)
INSERT INTO availability_slots (studio_id, date, time_slot_id, is_available)
SELECT 
    1 as studio_id,
    generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        INTERVAL '1 day'
    )::DATE as date,
    ts.id as time_slot_id,
    TRUE as is_available
FROM time_slots ts
WHERE ts.is_active = TRUE
ON CONFLICT (studio_id, date, time_slot_id) DO NOTHING;

-- Mark specific dates as unavailable
UPDATE availability_slots
SET is_available = FALSE
WHERE studio_id = 1
AND date = '2026-02-20'; -- Close this entire day
```

---

## Recommended Approach: Hybrid

Combine both approaches for maximum flexibility:

### Schema:

1. **time_slots** - Fixed time slots (never change)
2. **operating_hours** - Default weekly schedule
3. **special_dates** - Override specific dates (holidays, closures)
4. **bookings** - Actual bookings

### Availability Check Logic:

```javascript
// Backend API endpoint
app.get('/api/studios/:studioId/availability', async (req, res) => {
  const { studioId } = req.params;
  const { date } = req.query;

  // 1. Get day of week
  const dayOfWeek = new Date(date).getDay();

  // 2. Check special dates first (highest priority)
  const specialDate = await db.query(
    'SELECT * FROM special_dates WHERE studio_id = $1 AND date = $2',
    [studioId, date]
  );

  // 3. Get normal operating hours
  const operatingHours = await db.query(
    'SELECT * FROM operating_hours WHERE studio_id = $1 AND day_of_week = $2',
    [studioId, dayOfWeek]
  );

  // 4. Determine if studio is open
  let isOpen = false;
  if (specialDate.rows.length > 0) {
    isOpen = specialDate.rows[0].is_open;
  } else if (operatingHours.rows.length > 0) {
    isOpen = operatingHours.rows[0].is_open;
  }

  if (!isOpen) {
    return res.json({ available: false, reason: 'Closed on this date' });
  }

  // 5. Get available time slots
  const availableSlots = await db.query(`
    SELECT 
      ts.id,
      ts.start_time,
      ts.end_time,
      CASE WHEN b.id IS NULL THEN TRUE ELSE FALSE END as available
    FROM time_slots ts
    LEFT JOIN bookings b 
      ON b.time_slot_id = ts.id 
      AND b.booking_date = $1 
      AND b.studio_id = $2
      AND b.status != 'cancelled'
    WHERE ts.is_active = TRUE
    ORDER BY ts.start_time
  `, [date, studioId]);

  res.json({
    available: true,
    date,
    slots: availableSlots.rows
  });
});
```

---

## Admin Control Panel

Create API endpoints for admins to manage:

### Close a Specific Date
```javascript
app.post('/api/admin/studios/:studioId/close-date', async (req, res) => {
  const { studioId } = req.params;
  const { date, reason } = req.body;

  await db.query(`
    INSERT INTO special_dates (studio_id, date, is_open, reason)
    VALUES ($1, $2, FALSE, $3)
    ON CONFLICT (studio_id, date) 
    DO UPDATE SET is_open = FALSE, reason = $3
  `, [studioId, date, reason]);

  res.json({ success: true });
});
```

### Update Operating Hours
```javascript
app.put('/api/admin/studios/:studioId/operating-hours', async (req, res) => {
  const { studioId } = req.params;
  const { dayOfWeek, isOpen, openingTime, closingTime } = req.body;

  await db.query(`
    INSERT INTO operating_hours (studio_id, day_of_week, is_open, opening_time, closing_time)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (studio_id, day_of_week)
    DO UPDATE SET is_open = $3, opening_time = $4, closing_time = $5
  `, [studioId, dayOfWeek, isOpen, openingTime, closingTime]);

  res.json({ success: true });
});
```

---

## Summary

### Best Practice Structure:

```
time_slots (fixed)
    └─> Define all possible time slots

operating_hours (weekly pattern)
    └─> Default schedule (Monday-Friday, etc.)

special_dates (exceptions)
    └─> Override for specific dates (holidays, closures)

bookings
    └─> Actual reservations

Availability = operating_hours OR special_dates - bookings
```

### Benefits:
✅ Time slots are fixed and reusable
✅ Easy to change weekly schedule
✅ Can close/open specific dates
✅ Prevents double booking
✅ Admins can control availability
✅ Scales well with multiple studios

This gives you full control from the backend without changing your frontend code!
