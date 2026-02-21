'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StudioList from '@/components/StudioList';
import DateSelector from '@/components/DateSelector';
import { useBookingType } from '@/lib/bookingContext'; // Import useBookingType

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const searchParams = useSearchParams();
  const { bookingType, setBookingType } = useBookingType(); // Consume bookingType from context

  useEffect(() => {
    const queryType = searchParams?.get('bookingType');
    if (queryType === 'whole_studio' || queryType === 'slot') {
      setBookingType(queryType);
    }
  }, [searchParams, setBookingType]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">Book Your Photo Studio</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Choose from available studio slots and book your session
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
        <DateSelector onDateSelect={(d) => setSelectedDate(d)} selectedDate={selectedDate} />
      </div>

      {/* Studio Listings */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <StudioList selectedDate={selectedDate} bookingType={bookingType} /> {/* Pass bookingType to StudioList */}
      </div>
    </div>
  );
}

