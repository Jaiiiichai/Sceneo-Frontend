'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cartContext';
import { BookingType } from '@/lib/bookingContext'; // Import BookingType from the new context
import { getSlotsForDate, filterSlotsByBookingType, isSlotTooClose } from '@/lib/timeSlots';

interface Studio {
  id: string;
  time: string;
  endTime: string;
  name: string;
  subDetails: string[];
  duration: string;
  price: string;
  status: 'available' | 'registration_closed' | 'fully_booked';
  icon?: string;
  slotsAvailable?: number;
}

interface StudioListProps {
  selectedDate?: Date;
  bookingType: BookingType; // Add this prop
}

export default function StudioList({ selectedDate, bookingType }: StudioListProps) {
  const [generatedStudios, setGeneratedStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();

  // Helper function to format date in local timezone as YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch time slots based on selected date and booking type
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) {
        setGeneratedStudios([]);
        return;
      }

      console.log('=== DATE SELECTION DEBUG ===');
      console.log('Selected Date (raw):', selectedDate);
      console.log('Selected Date (toString):', selectedDate.toString());
      console.log('Selected Date (formatted):', formatLocalDate(selectedDate));

      setLoading(true);
      try {
        const allSlots = await getSlotsForDate(selectedDate);
        const bookingTypeMap = bookingType === 'whole_studio' ? 'studio' : 'professional';
        const filteredSlots = filterSlotsByBookingType(allSlots, bookingTypeMap);
        
        // Generate studio listings from time slots
        const studios = filteredSlots.map((slot) => {
          const isTooClose = isSlotTooClose(slot, selectedDate);
          const capacity = slot.capacity ?? (bookingType === 'whole_studio' ? 1 : 5);
          
          // Determine status based on capacity and time
          let status: 'available' | 'registration_closed' | 'fully_booked';
          if (capacity <= 0) {
            status = 'fully_booked';
          } else if (isTooClose) {
            status = 'registration_closed';
          } else {
            status = 'available';
          }
          
          return {
            id: slot.id,
            time: slot.startTime,
            endTime: slot.endTime,
            name: bookingType === 'whole_studio' ? 'STUDIO RENTAL' : `PROFESSIONAL SESSION`,
            subDetails: [slot.description],
            duration: '55 MIN',
            price: slot.priceDisplay,
            status,
            icon: bookingType === 'whole_studio' ? '🏢' : '📸',
            slotsAvailable: capacity,
          };
        });
        
        setGeneratedStudios(studios);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setGeneratedStudios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, bookingType]);

  // Use studios from time slots
  const studiosToDisplay = generatedStudios;

  const displayStudios = studiosToDisplay;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'registration_closed':
        return 'text-gray-600';
      case 'fully_booked':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'AVAILABLE';
      case 'registration_closed':
        return 'REGISTRATION CLOSED';
      case 'fully_booked':
        return 'SLOT FULL';
      default:
        return status;
    }
  };

  const isBookingDisabled = (status: string) => status !== 'available';

  // Show loading state while fetching time slots
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading available time slots...</p>
      </div>
    );
  }

  // Show empty state when no slots are available
  if (displayStudios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
        <p className="text-gray-600 text-lg">No time slots available for this date.</p>
        <p className="text-gray-500 text-sm">Please select a different date or booking type.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {displayStudios.map((studio) => (
        <div
          key={studio.id}
          className="border border-gray-300 rounded-lg p-4 sm:p-5 bg-white hover:shadow-md transition-shadow"
        >
          {/* Mobile Layout */}
          <div className="flex flex-col sm:hidden space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-gray-900">{studio.time}</p>
                <p className="text-sm text-gray-700">{studio.duration}</p>
                <p className="font-semibold text-gray-900">{studio.price}</p>
              </div>
              <p className={`text-xs font-semibold ${getStatusColor(studio.status)}`}>
                {getStatusText(studio.status)}
              </p>
            </div>
            {studio.status === 'available' && studio.slotsAvailable !== undefined && (
              <p className="text-xs text-gray-500">
                {studio.slotsAvailable} {studio.slotsAvailable === 1 ? 'slot' : 'slots'} available
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (!isBookingDisabled(studio.status)) {
                    const formattedDate = selectedDate ? formatLocalDate(selectedDate) : undefined;
                    console.log('=== ADD TO CART CLICKED ===');
                    console.log('Studio:', studio);
                    console.log('Selected Date:', selectedDate);
                    console.log('Formatted Date:', formattedDate);
                    
                    addItem({
                      id: studio.id,
                      time: studio.time,
                      name: studio.name,
                      duration: studio.duration,
                      price: studio.price,
                      timeSlotId: studio.id,
                      bookingDate: formattedDate,
                      bookingType: bookingType === 'slot' ? 'professional_slots' : 'whole_studio',
                    });
                  }
                }}
                disabled={isBookingDisabled(studio.status)}
                className={`w-full px-6 py-2.5 rounded-full font-bold transition-all ${
                  isBookingDisabled(studio.status)
                    ? 'bg-gray-300 text-white cursor-not-allowed opacity-60'
                    : 'border-2 border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                ADD TO CART
              </button>
              <button
                onClick={() => {
                  if (!isBookingDisabled(studio.status)) {
                    const params = new URLSearchParams();
                    params.set('studioId', studio.id);
                    params.set('time', studio.time);
                    params.set('name', studio.name);
                    params.set('price', studio.price);
                    params.set('duration', studio.duration);
                    if (selectedDate) params.set('date', formatLocalDate(selectedDate));
                    router.push(`/pages/booking/checkout?${params.toString()}`);
                  }
                }}
                disabled={isBookingDisabled(studio.status)}
                className={`w-full px-6 py-2.5 rounded-full font-bold transition-all ${
                  isBookingDisabled(studio.status)
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                    : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                }`}
              >
                BOOK
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-6">
            {/* Time */}
            <div className="w-20 flex-shrink-0">
              <p className="font-bold text-gray-900">{studio.time}</p>
            </div>

            {/* Duration & Price */}
            <div className="w-24 lg:w-28 flex-shrink-0">
              <p className="text-sm text-gray-700">{studio.duration}</p>
              <p className="font-semibold text-gray-900">{studio.price}</p>
            </div>

            {/* Status */}
            <div className="flex-grow">
              <p className={`text-sm font-semibold ${getStatusColor(studio.status)}`}>
                {getStatusText(studio.status)}
              </p>
              {studio.status === 'available' && studio.slotsAvailable !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  {studio.slotsAvailable} {studio.slotsAvailable === 1 ? 'slot' : 'slots'} available
                </p>
              )}
            </div>

            {/* Book Buttons */}
            <div className="flex-shrink-0 flex gap-2">
            <button
              onClick={() => {
                if (!isBookingDisabled(studio.status)) {
                  const formattedDate = selectedDate ? formatLocalDate(selectedDate) : undefined;
                  console.log('=== ADD TO CART CLICKED (Desktop) ===');
                  console.log('Studio:', studio);
                  console.log('Selected Date:', selectedDate);
                  console.log('Formatted Date:', formattedDate);
                  
                  addItem({
                    id: studio.id,
                    time: studio.time,
                    name: studio.name,
                    duration: studio.duration,
                    price: studio.price,
                    timeSlotId: studio.id,
                    bookingDate: formattedDate,
                    bookingType: bookingType === 'slot' ? 'professional_slots' : 'whole_studio',
                  });
                }
              }}
              disabled={isBookingDisabled(studio.status)}
              className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                isBookingDisabled(studio.status)
                  ? 'bg-gray-300 text-white cursor-not-allowed opacity-60'
                  : 'border-2 border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              ADD TO CART
            </button>
            <button
              onClick={() => {
                if (!isBookingDisabled(studio.status)) {
                  // Navigate to checkout page with studio data in query params
                  const params = new URLSearchParams();
                  params.set('studioId', studio.id);
                  params.set('time', studio.time);
                  params.set('name', studio.name);
                  params.set('price', studio.price);
                  params.set('duration', studio.duration);
                  if (selectedDate) params.set('date', formatLocalDate(selectedDate));
                  router.push(`/pages/booking/checkout?${params.toString()}`);
                }
              }}
              disabled={isBookingDisabled(studio.status)}
              className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                isBookingDisabled(studio.status)
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-black text-white hover:bg-gray-800 active:scale-95'
              }`}
            >
              BOOK
            </button>
          </div>
          </div>
        </div>
      ))}
    </div>
  );
}

