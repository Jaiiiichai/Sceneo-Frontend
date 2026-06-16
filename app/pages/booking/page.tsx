'use client';

import { useEffect, useState } from 'react';
import StudioList from '@/components/StudioList';
import DateSelector from '@/components/DateSelector';
import { useBookingType } from '@/lib/bookingContext'; // Import useBookingType
import { Building2, CalendarCheck } from 'lucide-react';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { bookingType, setBookingType } = useBookingType(); // Consume bookingType from context

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const queryType = searchParams?.get('bookingType');
    if (queryType === 'whole_studio' || queryType === 'slot') {
      setBookingType(queryType);
    }
  }, [setBookingType]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="overflow-hidden rounded-lg bg-slate-950 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Sceneo Booking</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Plan your studio session.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Choose your date, pick a time, then add available photographers or make-up artists during checkout.
            </p>
          </div>
          <div className="border-t border-white/10 bg-white/8 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setBookingType('slot')}
                className={`rounded-lg border p-4 text-left transition ${
                  bookingType === 'slot'
                    ? 'border-white bg-white text-slate-950'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck size={22} />
                  <div>
                    <p className="font-black">Book a Slot</p>
                    <p className={`text-sm ${bookingType === 'slot' ? 'text-slate-600' : 'text-white/65'}`}>Scheduled session for focused shoots.</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBookingType('whole_studio')}
                className={`rounded-lg border p-4 text-left transition ${
                  bookingType === 'whole_studio'
                    ? 'border-white bg-white text-slate-950'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 size={22} />
                  <div>
                    <p className="font-black">Whole Studio</p>
                    <p className={`text-sm ${bookingType === 'whole_studio' ? 'text-slate-600' : 'text-white/65'}`}>Private access for longer productions.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <DateSelector onDateSelect={(d) => setSelectedDate(d)} selectedDate={selectedDate} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <StudioList selectedDate={selectedDate} bookingType={bookingType} /> {/* Pass bookingType to StudioList */}
      </div>
    </div>
  );
}

