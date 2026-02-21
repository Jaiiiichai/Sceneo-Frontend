'use client';

import { useState } from 'react';
import DateSelector from '@/components/DateSelector';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import { TimeSlot } from '@/lib/timeSlots';

export default function PhotographerBookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>(undefined);
  const [selectedTimeSlotData, setSelectedTimeSlotData] = useState<TimeSlot | undefined>(undefined);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(undefined); // Reset time slot when date changes
    setSelectedTimeSlotData(undefined);
  };

  const handleTimeSlotSelect = (slotId: string, timeSlot: TimeSlot) => {
    setSelectedTimeSlot(slotId);
    setSelectedTimeSlotData(timeSlot);
  };

  const handleBookPhotographer = () => {
    if (selectedDate && selectedTimeSlot && selectedTimeSlotData) {
      alert(`Photographer booked for ${selectedDate.toDateString()} at ${selectedTimeSlotData.displayTime}`);
      // In a real application, you would integrate with a booking API here
      // and potentially navigate to a confirmation page or add to cart.
    } else {
      alert('Please select a date and a time slot.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">
          Book a Photographer
        </h1>

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-8">
          <DateSelector onDateSelect={handleDateSelect} selectedDate={selectedDate} />

          <TimeSlotSelection
            selectedDate={selectedDate}
            onSlotSelect={handleTimeSlotSelect}
            selectedSlot={selectedTimeSlot}
          />

          <div className="pt-6">
            <button
              onClick={handleBookPhotographer}
              disabled={!selectedDate || !selectedTimeSlot}
              className={`w-full py-4 px-6 rounded-xl text-lg font-bold text-white transition-all duration-300 ${
                selectedDate && selectedTimeSlot
                  ? 'bg-black hover:bg-gray-800 shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Book Photographer Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
