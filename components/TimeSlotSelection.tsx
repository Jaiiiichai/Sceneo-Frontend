'use client';

import { useState, useEffect } from 'react';
import { getSlotsForDate, filterSlotsByBookingType, TimeSlot, getBookingTypeLabel, isSlotTooClose } from '@/lib/timeSlots';
import { useBookingType } from '@/lib/bookingContext';

interface TimeSlotSelectionProps {
  selectedDate?: Date;
  onSlotSelect: (slotId: string, timeSlot: TimeSlot) => void;
  selectedSlot?: string;
}

export default function TimeSlotSelection({ selectedDate, onSlotSelect, selectedSlot }: TimeSlotSelectionProps) {
  const { bookingType } = useBookingType();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch available slots when date or booking type changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) {
        setTimeSlots([]);
        return;
      }

      setLoading(true);
      try {
        const allSlots = await getSlotsForDate(selectedDate);
        
        // Filter by booking type
        const bookingTypeMap = bookingType === 'whole_studio' ? 'studio' : 'professional';
        const filteredSlots = filterSlotsByBookingType(allSlots, bookingTypeMap);
        
        setTimeSlots(filteredSlots);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, bookingType]);

  if (!selectedDate) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">Please select a date first to see available time slots</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
        <p className="text-gray-600">Loading available time slots...</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">No time slots available for this booking type on this day</p>
      </div>
    );
  }

  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select a Time Slot</h2>
        <p className="text-gray-600 mt-1">For {dateStr}</p>
        <p className="text-sm text-gray-500 mt-1">
          Booking Type: <span className="font-semibold">{getBookingTypeLabel(bookingType === 'whole_studio' ? 'whole_studio' : 'professional_slots')}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {timeSlots.map((slot) => {
          const isBooked = (slot.capacity ?? 0) <= 0;
          const isTooClose = selectedDate ? isSlotTooClose(slot, selectedDate) : false;
          const isDisabled = isBooked || isTooClose;
          
          return (
            <button
              key={slot.id}
              onClick={() => !isDisabled && onSlotSelect(slot.id, slot)}
              disabled={isDisabled}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                selectedSlot === slot.id
                  ? 'bg-black text-white shadow-lg'
                  : isDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-black active:text-white'
              }`}
            >
              <div className="text-sm font-medium">{slot.displayTime}</div>
              <div className="text-xs mt-1 font-semibold">{slot.priceDisplay}</div>
              {isBooked && <div className="text-xs mt-1 text-red-600">Slot Full</div>}
              {isTooClose && !isBooked && <div className="text-xs mt-1 text-orange-600">Too Soon</div>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Booking Duration:</span> 55 minutes per slot
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Note:</span> {timeSlots[0]?.description}
          </p>
          {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
            <p className="text-sm text-orange-600">
              <span className="font-semibold">⏰ Same-day booking:</span> Slots must be booked at least 1 hour in advance
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
