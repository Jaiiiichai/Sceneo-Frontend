/**
 * Time Slots Configuration
 * Fetches available time slots from the API
 */

import { api, APIError } from '@/network';

export type BookingType = 'whole_studio' | 'professional_slots' | 'both';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  bookingType: BookingType;
  description: string;
  price: number;
  priceDisplay: string;
  dayOfWeek?: number;
  durationMinutes?: number;
  capacity?: number;
  isActive?: boolean;
}

// API Response interface
interface ApiTimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  display_time: string;
  day_of_week: number;
  booking_type: 'whole_studio' | 'professional_slots';
  description: string;
  price: number;
  duration_minutes: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AvailableSlotItem {
  id: string;
  remaining: number;
}

function mapInventoryToAvailableSlotItems(inventory: SlotInventoryItem[]): AvailableSlotItem[] {
  return inventory
    .filter(item => item.time_slots?.is_active)
    .map(item => ({
      id: item.time_slot_id,
      remaining: item.remaining,
    }));
}

// Slot Inventory API Response interface
interface SlotInventoryItem {
  id: number;
  time_slot_id: string;
  booking_date: string;
  remaining: number;
  time_slots: {
    id: string;
    price: number;
    capacity: number;
    start_time: string;
    end_time: string;
    display_time: string;
    day_of_week: number;
    booking_type: 'whole_studio' | 'professional_slots';
    description: string;
    duration_minutes: number;
    is_active: boolean;
  };
}

export interface TimeSlotWithInventory extends TimeSlot {
  inventoryId: number;
  bookingDate: string;
  remaining: number;
  maxCapacity: number;
}

// Cache for time slots
let cachedTimeSlots: ApiTimeSlot[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function formatBookingDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch all time slots from the API
 */
export async function fetchAllTimeSlots(): Promise<ApiTimeSlot[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedTimeSlots && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedTimeSlots;
  }

  try {
    const response = await api.get('/time-slots');
    
    if (response.success && response.data) {
      cachedTimeSlots = response.data;
      lastFetchTime = now;
      return response.data;
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch slot inventory for a specific date
 * @param date - Date string in YYYY-MM-DD format or Date object
 */
export async function fetchSlotInventory(date: Date | string): Promise<SlotInventoryItem[]> {
  try {
    // Format date as YYYY-MM-DD
    let dateStr: string;
    if (typeof date === 'string') {
      dateStr = date;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }

    const response = await api.get('/slot-inventory', { params: { date: dateStr } });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch available time slot IDs and remaining capacity for a specific date
 * @param date - Date string in YYYY-MM-DD format or Date object
 */
export async function fetchAvailableSlots(date: Date | string): Promise<AvailableSlotItem[]> {
  try {
    const bookingDate = formatBookingDate(date);

    const response = await api.get('/time-slots/available', {
      params: { booking_date: bookingDate },
    });

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    const isSchemaCacheError =
      error instanceof APIError &&
      error.data?.code === 'PGRST204' &&
      String(error.data?.message || '').includes('time_slot_id');

    if (isSchemaCacheError) {
      const inventory = await fetchSlotInventory(date);
      return mapInventoryToAvailableSlotItems(inventory);
    }

    return [];
  }
}

/**
 * Map slot inventory item to TimeSlotWithInventory
 */
function mapInventoryToTimeSlot(inventory: SlotInventoryItem): TimeSlotWithInventory {
  const timeSlot = inventory.time_slots;
  return {
    id: timeSlot.id,
    startTime: timeSlot.display_time.split(' - ')[0] || timeSlot.start_time,
    endTime: timeSlot.display_time.split(' - ')[1] || timeSlot.end_time,
    displayTime: timeSlot.display_time,
    bookingType: timeSlot.booking_type,
    description: timeSlot.description,
    price: timeSlot.price,
    priceDisplay: `₱${timeSlot.price.toLocaleString()}`,
    dayOfWeek: timeSlot.day_of_week,
    durationMinutes: timeSlot.duration_minutes,
    capacity: timeSlot.capacity,
    isActive: timeSlot.is_active,
    inventoryId: inventory.id,
    bookingDate: inventory.booking_date,
    remaining: inventory.remaining,
    maxCapacity: timeSlot.capacity,
  };
}

/**
 * Convert API time slot to frontend TimeSlot format
 */
function mapApiTimeSlot(apiSlot: ApiTimeSlot): TimeSlot {
  return {
    id: apiSlot.id,
    startTime: apiSlot.display_time.split(' - ')[0] || apiSlot.start_time,
    endTime: apiSlot.display_time.split(' - ')[1] || apiSlot.end_time,
    displayTime: apiSlot.display_time,
    bookingType: apiSlot.booking_type,
    description: apiSlot.description,
    price: apiSlot.price,
    priceDisplay: `₱${apiSlot.price.toLocaleString()}`,
    dayOfWeek: apiSlot.day_of_week,
    durationMinutes: apiSlot.duration_minutes,
    capacity: apiSlot.capacity,
    isActive: apiSlot.is_active,
  };
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dayName: string;
  isOpen: boolean;
  slots: TimeSlot[];
}

/**
 * DEPRECATED: Old hardcoded weekday slots - now fetched from API
 * Kept for backward compatibility
 */
const WEEKDAY_SLOTS_DEPRECATED: TimeSlot[] = [
  {
    id: 'slot-07-00',
    startTime: '7:00 AM',
    endTime: '7:55 AM',
    displayTime: '7:00 AM - 7:55 AM',
    bookingType: 'whole_studio',
    description: 'Book Whole Studio Only',
    price: 1500,
    priceDisplay: '₱1,500'
  },
  {
    id: 'slot-08-00',
    startTime: '8:00 AM',
    endTime: '8:55 AM',
    displayTime: '8:00 AM - 8:55 AM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-09-00',
    startTime: '9:00 AM',
    endTime: '9:55 AM',
    displayTime: '9:00 AM - 9:55 AM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-10-00',
    startTime: '10:00 AM',
    endTime: '10:55 AM',
    displayTime: '10:00 AM - 10:55 AM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-11-00',
    startTime: '11:00 AM',
    endTime: '11:55 AM',
    displayTime: '11:00 AM - 11:55 AM',
    bookingType: 'whole_studio',
    description: 'Book Whole Studio Only',
    price: 1500,
    priceDisplay: '₱1,500'
  },
  {
    id: 'slot-12-00',
    startTime: '12:00 PM',
    endTime: '12:55 PM',
    displayTime: '12:00 PM - 12:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-13-00',
    startTime: '1:00 PM',
    endTime: '1:55 PM',
    displayTime: '1:00 PM - 1:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-14-00',
    startTime: '2:00 PM',
    endTime: '2:55 PM',
    displayTime: '2:00 PM - 2:55 PM',
    bookingType: 'whole_studio',
    description: 'Book Whole Studio Only',
    price: 1500,
    priceDisplay: '₱1,500'
  },
  {
    id: 'slot-15-00',
    startTime: '3:00 PM',
    endTime: '3:55 PM',
    displayTime: '3:00 PM - 3:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-16-00',
    startTime: '4:00 PM',
    endTime: '4:55 PM',
    displayTime: '4:00 PM - 4:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-17-00',
    startTime: '5:00 PM',
    endTime: '5:55 PM',
    displayTime: '5:00 PM - 5:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-18-00',
    startTime: '6:00 PM',
    endTime: '6:55 PM',
    displayTime: '6:00 PM - 6:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-19-00',
    startTime: '7:00 PM',
    endTime: '7:55 PM',
    displayTime: '7:00 PM - 7:55 PM',
    bookingType: 'professional_slots',
    description: 'Individual Professional Slots',
    price: 500,
    priceDisplay: '₱500'
  },
  {
    id: 'slot-20-00',
    startTime: '8:00 PM',
    endTime: '8:55 PM',
    displayTime: '8:00 PM - 8:55 PM',
    bookingType: 'whole_studio',
    description: 'Book Whole Studio Only',
    price: 1500,
    priceDisplay: '₱1,500'
  }
];

/**
 * DEPRECATED: Old hardcoded weekend slots - now fetched from API
 * Kept for backward compatibility
 */
const WEEKEND_SLOTS_DEPRECATED: TimeSlot[] = [
  {
    id: 'slot-09-00',
    startTime: '9:00 AM',
    endTime: '9:55 AM',
    displayTime: '9:00 AM - 9:55 AM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-10-00',
    startTime: '10:00 AM',
    endTime: '10:55 AM',
    displayTime: '10:00 AM - 10:55 AM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-11-00',
    startTime: '11:00 AM',
    endTime: '11:55 AM',
    displayTime: '11:00 AM - 11:55 AM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-12-00',
    startTime: '12:00 PM',
    endTime: '12:55 PM',
    displayTime: '12:00 PM - 12:55 PM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-13-00',
    startTime: '1:00 PM',
    endTime: '1:55 PM',
    displayTime: '1:00 PM - 1:55 PM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-14-00',
    startTime: '2:00 PM',
    endTime: '2:55 PM',
    displayTime: '2:00 PM - 2:55 PM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-15-00',
    startTime: '3:00 PM',
    endTime: '3:55 PM',
    displayTime: '3:00 PM - 3:55 PM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  },
  {
    id: 'slot-16-00',
    startTime: '4:00 PM',
    endTime: '4:55 PM',
    displayTime: '4:00 PM - 4:55 PM',
    bookingType: 'both',
    description: 'Studio or Professional Slots',
    price: 800,
    priceDisplay: '₱800'
  }
];

/**
 * Get weekly schedule from API
 */
export async function getWeeklySchedule(): Promise<DaySchedule[]> {
  const apiSlots = await fetchAllTimeSlots();
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const schedule: DaySchedule[] = [];
  
  for (let day = 0; day < 7; day++) {
    const daySlotsApi = apiSlots.filter(slot => slot.day_of_week === day && slot.is_active);
    const daySlots = daySlotsApi.map(mapApiTimeSlot);
    
    schedule.push({
      dayOfWeek: day,
      dayName: dayNames[day],
      isOpen: daySlots.length > 0,
      slots: daySlots
    });
  }
  
  return schedule;
}

/**
 * Get slots for a specific day of week
 * @param dayOfWeek - 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export async function getSlotsForDay(dayOfWeek: number): Promise<TimeSlot[]> {
  const apiSlots = await fetchAllTimeSlots();
  const daySlotsApi = apiSlots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_active);
  return daySlotsApi.map(mapApiTimeSlot);
}

/**
 * Get slots for a specific date using /time-slots API
 * @param date - Date object or date string
 */
export async function getSlotsForDate(date: Date | string): Promise<TimeSlot[]> {
  const [apiSlots, availableSlots] = await Promise.all([
    fetchAllTimeSlots(),
    fetchAvailableSlots(date),
  ]);

  if (availableSlots.length === 0) {
    return [];
  }

  const remainingById = new Map(availableSlots.map(slot => [slot.id, slot.remaining]));

  return apiSlots
    .filter(slot => slot.is_active && remainingById.has(slot.id))
    .map(slot => ({
      ...mapApiTimeSlot(slot),
      capacity: remainingById.get(slot.id),
    }));
}

/**
 * Get slots with inventory for a specific date using /slot-inventory API
 * @param date - Date object or date string
 */
export async function getSlotsWithInventory(date: Date | string): Promise<TimeSlotWithInventory[]> {
  const inventory = await fetchSlotInventory(date);
  return inventory
    .filter(item => item.time_slots.is_active)
    .map(mapInventoryToTimeSlot);
}

/**
 * Filter slots by booking type
 * @param slots - Array of time slots
 * @param bookingType - Type of booking
 */
export function filterSlotsByBookingType<T extends TimeSlot>(
  slots: T[],
  bookingType: 'studio' | 'professional'
): T[] {
  return slots.filter(slot => {
    if (slot.bookingType === 'both') return true;
    if (bookingType === 'studio' && slot.bookingType === 'whole_studio') return true;
    if (bookingType === 'professional' && slot.bookingType === 'professional_slots') return true;
    return false;
  });
}

/**
 * Get display label for booking type
 */
export function getBookingTypeLabel(bookingType: BookingType): string {
  switch (bookingType) {
    case 'whole_studio':
      return 'Book Whole Studio';
    case 'professional_slots':
      return 'Book Professional';
    case 'both':
      return 'Book Studio or Professional';
    default:
      return 'Book';
  }
}

/**
 * Check if a slot allows studio bookings
 */
export function allowsStudioBooking(slot: TimeSlot): boolean {
  return slot.bookingType === 'whole_studio' || slot.bookingType === 'both';
}

/**
 * Check if a slot allows professional bookings
 */
export function allowsProfessionalBooking(slot: TimeSlot): boolean {
  return slot.bookingType === 'professional_slots' || slot.bookingType === 'both';
}

/**
 * Check if a time slot should be disabled (closed) based on current time
 * Closes slots that are less than 1 hour away
 * @param slot - The time slot to check
 * @param selectedDate - The date selected by the user
 */
export function isSlotTooClose(slot: TimeSlot, selectedDate: Date): boolean {
  const now = new Date();
  
  // If selected date is not today, allow all slots
  const isToday = 
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();
  
  if (!isToday) {
    return false; // Don't disable slots for future dates
  }
  
  // Parse slot start time (format: "H:MM AM/PM" or "HH:MM AM/PM")
  const timeMatch = slot.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return false;
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const period = timeMatch[3].toUpperCase();
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  // Create a Date object for the slot time today
  const slotTime = new Date(now);
  slotTime.setHours(hours, minutes, 0, 0);
  
  // Calculate time difference in milliseconds
  const timeDiff = slotTime.getTime() - now.getTime();
  
  // Convert to hours (1 hour = 3600000 milliseconds)
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Disable if less than 1 hour away or already passed
  return hoursDiff < 1;
}

/**
 * Clear the time slots cache (useful after updates)
 */
export function clearTimeSlotsCache(): void {
  cachedTimeSlots = null;
  lastFetchTime = 0;
}

export default getWeeklySchedule;

