'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cartContext';
import { BookingType } from '@/lib/bookingContext'; // Import BookingType from the new context
import { setCheckoutDraft } from '@/lib/checkoutDraft';
import { getSlotsForDate, filterSlotsByBookingType, isSlotTooClose } from '@/lib/timeSlots';
import { ArrowRight, Building2, CalendarClock, Camera, ShoppingCart } from 'lucide-react';

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
      } catch {
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
      <div className="flex flex-col items-center justify-center space-y-3 py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950"></div>
        <p className="font-semibold text-slate-600">Loading available time slots...</p>
      </div>
    );
  }

  // Show empty state when no slots are available
  if (displayStudios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
        <CalendarClock className="h-10 w-10 text-slate-400" />
        <p className="text-lg font-bold text-slate-700">No time slots available for this date.</p>
        <p className="text-sm text-slate-500">Please select a different date or booking type.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Step 2</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Choose a Time</h2>
      </div>
      {displayStudios.map((studio) => (
        <div
          key={studio.id}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
        >
          {/* Mobile Layout */}
          <div className="flex flex-col sm:hidden space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-black text-slate-950">{studio.time}</p>
                <p className="text-sm text-slate-600">{studio.duration}</p>
                <p className="font-bold text-slate-950">{studio.price}</p>
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
                onClick={async () => {
                  if (!isBookingDisabled(studio.status)) {
                    const formattedDate = selectedDate ? formatLocalDate(selectedDate) : undefined;
                    await addItem({
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
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-bold transition-all ${
                  isBookingDisabled(studio.status)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                    : 'border border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white'
                }`}
              >
                <ShoppingCart size={16} />
                ADD TO CART
              </button>
              <button
                onClick={() => {
                  if (!isBookingDisabled(studio.status)) {
                    const formattedDate = selectedDate ? formatLocalDate(selectedDate) : formatLocalDate(new Date());
                    setCheckoutDraft({
                      id: `direct-${studio.id}-${formattedDate}`,
                      time: studio.time,
                      name: studio.name,
                      price: studio.price,
                      duration: studio.duration,
                      bookingDate: formattedDate,
                      timeSlotId: studio.id,
                      bookingType: bookingType === 'whole_studio' ? 'whole_studio' : 'professional_slots',
                    });
                    router.push('/pages/booking/checkout');
                  }
                }}
                disabled={isBookingDisabled(studio.status)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-bold transition-all ${
                  isBookingDisabled(studio.status)
                    ? 'bg-slate-300 text-white cursor-not-allowed opacity-70'
                    : 'bg-slate-950 text-white hover:bg-slate-800 active:scale-95'
                }`}
              >
                <ArrowRight size={16} />
                BOOK
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              {bookingType === 'whole_studio' ? <Building2 size={22} /> : <Camera size={22} />}
            </div>

            {/* Time */}
            <div className="w-24 flex-shrink-0">
              <p className="font-black text-slate-950">{studio.time}</p>
            </div>

            {/* Duration & Price */}
            <div className="w-24 lg:w-28 flex-shrink-0">
              <p className="text-sm text-slate-600">{studio.duration}</p>
              <p className="font-bold text-slate-950">{studio.price}</p>
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
              onClick={async () => {
                if (!isBookingDisabled(studio.status)) {
                  const formattedDate = selectedDate ? formatLocalDate(selectedDate) : undefined;
                  await addItem({
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
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-bold transition-all whitespace-nowrap ${
                isBookingDisabled(studio.status)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  : 'border border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white'
              }`}
            >
              <ShoppingCart size={16} />
              ADD TO CART
            </button>
            <button
              onClick={() => {
                if (!isBookingDisabled(studio.status)) {
                  const formattedDate = selectedDate ? formatLocalDate(selectedDate) : formatLocalDate(new Date());
                  setCheckoutDraft({
                    id: `direct-${studio.id}-${formattedDate}`,
                    time: studio.time,
                    name: studio.name,
                    price: studio.price,
                    duration: studio.duration,
                    bookingDate: formattedDate,
                    timeSlotId: studio.id,
                    bookingType: bookingType === 'whole_studio' ? 'whole_studio' : 'professional_slots',
                  });
                  router.push('/pages/booking/checkout');
                }
              }}
              disabled={isBookingDisabled(studio.status)}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-bold transition-all whitespace-nowrap ${
                isBookingDisabled(studio.status)
                  ? 'bg-slate-300 text-white cursor-not-allowed opacity-70'
                  : 'bg-slate-950 text-white hover:bg-slate-800 active:scale-95'
              }`}
            >
              <ArrowRight size={16} />
              BOOK
            </button>
          </div>
          </div>
        </div>
      ))}
    </div>
  );
}


