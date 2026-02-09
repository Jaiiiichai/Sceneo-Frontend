'use client';

import { useState } from 'react';

interface TimeSlot {
  time: string;
  isBooked: boolean;
}

interface TimeSlotSelectionProps {
  selectedDate?: Date;
  onSlotSelect: (time: string) => void;
  selectedSlot?: string;
}

export default function TimeSlotSelection({ selectedDate, onSlotSelect, selectedSlot }: TimeSlotSelectionProps) {
  // Generate 2-hour time slots (6 AM to 10 PM)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour < 22; hour += 2) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
      
      // Simulate some slots as fully booked (pseudo-random based on hour)
      const isBooked = Math.random() > 0.7; // 30% chance of being booked
      
      slots.push({
        time: `${startTime} - ${endTime}`,
        isBooked,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (!selectedDate) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">Please select a date first to see available time slots</p>
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {timeSlots.map((slot, idx) => (
          <button
            key={idx}
            onClick={() => !slot.isBooked && onSlotSelect(slot.time)}
            disabled={slot.isBooked}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedSlot === slot.time
                ? 'bg-black text-white shadow-lg'
                : slot.isBooked
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-black active:text-white'
            }`}
          >
            <div className="text-sm">{slot.time}</div>
            {slot.isBooked && <div className="text-xs mt-1">Fully Booked</div>}
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Booking Duration:</span> 2 hours per slot
        </p>
      </div>
    </div>
  );
}
