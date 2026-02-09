'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cartContext';
import { BookingType } from '@/lib/bookingContext'; // Import BookingType from the new context

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
  studios?: Studio[];
  selectedDate?: Date;
  bookingType: BookingType; // Add this prop
}

export default function StudioList({ studios, selectedDate, bookingType }: StudioListProps) {
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);
  const router = useRouter();
  const { addItem } = useCart();

  // Mock studio data for 'slot' booking
  const defaultStudiosSlot: Studio[] = [
    {
      id: '1',
      time: '10:30 AM',
      endTime: '12:00 PM',
      name: 'FEMME BASIC',
      subDetails: ['TADS RAINBOW'],
      duration: '1 HR 30 MIN',
      price: '₱400',
      status: 'registration_closed',
      icon: '👩‍🎨',
      slotsAvailable: 0,
    },
    {
      id: '2',
      time: '11:00 AM',
      endTime: '12:00 PM',
      name: 'ADDLIB KIDS',
      subDetails: ['TADS UNICORN'],
      duration: '1 HR',
      price: '₱350',
      status: 'registration_closed',
      icon: '🦄',
      slotsAvailable: 0,
    },
    {
      id: '3',
      time: '1:00 PM',
      endTime: '3:00 PM',
      name: 'PROFESSIONAL STUDIO',
      subDetails: ['PREMIUM LIGHTING'],
      duration: '2 HR',
      price: '₱600',
      status: 'available',
      icon: '📸',
      slotsAvailable: 5,
    },
    {
      id: '4',
      time: '3:30 PM',
      endTime: '5:00 PM',
      name: 'CREATIVE SPACE',
      subDetails: ['FULL SETUP'],
      duration: '1 HR 30 MIN',
      price: '₱450',
      status: 'available',
      icon: '🎨',
      slotsAvailable: 3,
    },
    {
      id: '5',
      time: '5:00 PM',
      endTime: '7:00 PM',
      name: 'COMPACT STUDIO',
      subDetails: ['BASIC EQUIPMENT'],
      duration: '2 HR',
      price: '₱300',
      status: 'fully_booked',
      icon: '📷',
      slotsAvailable: 0,
    },
  ];

  // Mock studio data for 'whole_studio' booking
  const defaultStudiosWholeStudio: Studio[] = [
    {
      id: 'ws-1',
      time: '9:00 AM',
      endTime: '5:00 PM',
      name: 'GRAND STUDIO (WHOLE DAY)',
      subDetails: ['FULL DAY RENTAL', 'ALL EQUIPMENT ACCESS'],
      duration: '8 HR',
      price: '₱5000',
      status: 'available',
      icon: '🏢',
      slotsAvailable: 2,
    },
    {
      id: 'ws-2',
      time: '10:00 AM',
      endTime: '6:00 PM',
      name: 'ELEGANT STUDIO (WHOLE DAY)',
      subDetails: ['FULL DAY RENTAL', 'PREMIUM SETUP'],
      duration: '8 HR',
      price: '₱6500',
      status: 'available',
      icon: '✨',
      slotsAvailable: 1,
    },
  ];

  // If a date is provided, vary the status deterministically per-date to demonstrate
  // different availability. This uses a simple hash of the date + studio id.
  const hashString = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 9973;
    return h;
  };

  const determineStatusForDate = (baseStatus: Studio['status'], date?: Date, id?: string) => {
    if (!date || !id) return baseStatus;
    const key = date.toDateString() + '|' + id;
    const v = hashString(key) % 10;
    if (v <= 2) return 'registration_closed';
    if (v <= 6) return 'available';
    return 'fully_booked';
  };

  const currentDefaultStudios = bookingType === 'whole_studio' ? defaultStudiosWholeStudio : defaultStudiosSlot;

  const displayStudios = (studios || currentDefaultStudios).map((s) => {
    const status = determineStatusForDate(s.status, selectedDate, s.id);
    // If slots available is 0, mark as fully booked
    const finalStatus = s.slotsAvailable === 0 ? 'fully_booked' : status;
    return {
      ...s,
      status: finalStatus,
    };
  });

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
        return 'FULLY BOOKED';
      default:
        return status;
    }
  };

  const isBookingDisabled = (status: string) => status !== 'available';

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
                    addItem({
                      id: studio.id,
                      time: studio.time,
                      name: studio.name,
                      duration: studio.duration,
                      price: studio.price,
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
                    if (selectedDate) params.set('date', selectedDate.toISOString());
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
                  addItem({
                    id: studio.id,
                    time: studio.time,
                    name: studio.name,
                    duration: studio.duration,
                    price: studio.price,
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
                  if (selectedDate) params.set('date', selectedDate.toISOString());
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

      {selectedStudio && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900 font-semibold">
            Studio {selectedStudio} selected. Proceed to checkout.
          </p>
        </div>
      )}
    </div>
  );
}

