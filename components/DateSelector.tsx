'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/network';

interface DateSelectorProps {
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

interface ClosedDate {
  id: number;
  closed_date: string;
  reason: string;
  created_at: string;
}

export default function DateSelector({ onDateSelect, selectedDate }: DateSelectorProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [closedDates, setClosedDates] = useState<string[]>([]);

  // Fetch closed dates from API
  useEffect(() => {
    const fetchClosedDates = async () => {
      try {
        const result = await api.get('/closed-dates');
        
        if (result.success && result.data) {
          // Extract just the date strings
          const dates = result.data.map((item: ClosedDate) => item.closed_date);
          setClosedDates(dates);
        }
      } catch {
      }
    };

    fetchClosedDates();
  }, []);

  // Generate next 30 days
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const scroll = (direction: 'left' | 'right') => {
    const scrollAmount = 300;
    const container = document.getElementById('date-container');
    if (container) {
      const newPosition = direction === 'left' ? scrollPosition - scrollAmount : scrollPosition + scrollAmount;
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isClosed = (date: Date) => {
    // Format date to YYYY-MM-DD using local timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return closedDates.includes(dateString);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Step 1</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Select a Date</h2>
      </div>
      
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-slate-50 sm:block"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        <div
          id="date-container"
          className="scrollbar-hide flex gap-2 overflow-x-auto px-0 py-2 sm:gap-3 sm:px-12 sm:py-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {dates.map((date, idx) => {
            const dateIsClosed = isClosed(date);
            const dateIsSelected = isSelected(date);
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (!dateIsClosed) {
                    onDateSelect(date);
                  }
                }}
                disabled={dateIsClosed}
                className={`min-w-28 flex-shrink-0 rounded-lg border px-4 py-3 text-sm font-bold whitespace-nowrap transition-all sm:px-6 ${
                  dateIsClosed
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-70 line-through'
                    : dateIsSelected
                    ? 'border-slate-950 bg-slate-950 text-white shadow-lg'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-950 hover:bg-slate-50'
                }`}
              >
                {formatDate(date)}
                {dateIsClosed && <div className="text-xs mt-1">Closed</div>}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-slate-50 sm:block"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
}

