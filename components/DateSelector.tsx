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
      } catch (error) {
        console.error('Error fetching closed dates:', error);
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
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Select a Date</h2>
      
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        <div
          id="date-container"
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-0 sm:px-12 py-2 sm:py-4"
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
                    console.log('=== DATE SELECTOR CLICKED ===');
                    console.log('Date object:', date);
                    console.log('Date toString:', date.toString());
                    console.log('Date toDateString:', date.toDateString());
                    console.log('Date getDate:', date.getDate());
                    console.log('Date getMonth:', date.getMonth());
                    console.log('Date getFullYear:', date.getFullYear());
                    onDateSelect(date);
                  }
                }}
                disabled={dateIsClosed}
                className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold whitespace-nowrap transition-all ${
                  dateIsClosed
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 line-through'
                    : dateIsSelected
                    ? 'bg-black text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
}
