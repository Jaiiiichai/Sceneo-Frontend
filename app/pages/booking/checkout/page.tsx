'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CartItem, useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/authContext';
import { api } from '@/network';
import { useToast } from '@/lib/toastContext';

export default function BookingCheckoutPage() {
  const { items, clearCart, setIsOpen } = useCart();
  const { user, fetchUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(true);
  const [allowCompanions, setAllowCompanions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [directBookingItem, setDirectBookingItem] = useState<CartItem | null>(null);

  // Helper function to format date in local timezone as YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const checkoutItems = items.length > 0
    ? items
    : directBookingItem
    ? [directBookingItem]
    : [];

  const total = checkoutItems.reduce((sum, it) => sum + parseFloat(it.price.replace(/[^0-9.]/g, '')), 0);

  // Fetch user data on mount and auto-fill form
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated()) {
        try {
          await fetchUser();
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };
    
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill form when user data is available
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || checkoutItems.length === 0) {
      showToast('Please provide name, email and at least one booking item.', 'error');
      return;
    }
    if (!acceptPolicy) {
      showToast('Please agree to the cancellation policy.', 'error');
      return;
    }
    
    if (!isAuthenticated()) {
      showToast('Please log in to complete your booking.', 'error');
      const nextPath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/pages/booking/checkout';
      router.push(`/pages/Auth/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    setSubmitting(true);

    try {
      // Extract UUID from potentially concatenated ID (cart adds timestamp)
      const extractUUID = (id: string): string => {
        // UUID format: 8-4-4-4-12 characters (36 total)
        const uuidMatch = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return uuidMatch ? uuidMatch[0] : id;
      };

      // Create bookings for each checkout item
      const bookingPromises = checkoutItems.map(async (item) => {
        // Parse time to HH:MM:SS format
        const parseTime = (timeStr: string): string => {
          // If already in HH:MM:SS format, return as is
          if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
          
          // Parse from "7:00 AM" format
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2];
            const meridiem = match[3].toUpperCase();
            
            if (meridiem === 'PM' && hours < 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
            
            return `${String(hours).padStart(2, '0')}:${minutes}:00`;
          }
          
          return '09:00:00'; // Default fallback
        };

        const bookingData = {
          user_id: user?.id || 0,
          customer_name: name,
          customer_email: email,
          customer_phone: phone || '',
          booking_type: item.bookingType || 'professional_slots',
          booking_date: item.bookingDate || formatLocalDate(new Date()),
          booking_time: parseTime(item.time),
          booking_status: 'confirmed',
          booking_price: parseFloat(item.price.replace(/[^0-9.]/g, '')),
          service_type: item.serviceType || item.name,
          service_provider_id: item.serviceProviderId || 1,
          time_slot_id: item.timeSlotId || extractUUID(item.id)
        };

        console.log('Creating booking:', bookingData);
        console.log('Booking date from cart item:', item.bookingDate);
        console.log('Final booking date:', bookingData.booking_date);
        return api.post('/bookings', bookingData, { requiresAuth: true });
      });

      const results = await Promise.all(bookingPromises);
      console.log('Booking results:', results);
      
      // Check if all bookings were successful
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        showToast(`Booking confirmed for ${name}.`, 'success');
        await clearCart();
        setIsOpen(false);
        router.push('/');
      } else {
        const failedCount = results.filter(r => !r.success).length;
        showToast(`${failedCount} booking(s) failed. Please try again.`, 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      showToast('An error occurred while creating your booking. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!searchParams) return;
    const studioId = searchParams.get('studioId');
    if (!studioId) {
      setDirectBookingItem(null);
      return;
    }

    const date = searchParams.get('date') || formatLocalDate(new Date());
    const time = searchParams.get('time') || '';
    const name = searchParams.get('name') || 'Studio Booking';
    const price = searchParams.get('price') || '₱0';
    const duration = searchParams.get('duration') || '';
    const timeSlotId = searchParams.get('timeSlotId') || studioId;
    const bookingTypeParam = searchParams.get('bookingType') || 'professional_slots';
    const bookingType = (bookingTypeParam === 'whole_studio' || bookingTypeParam === 'professional_slots') 
      ? bookingTypeParam 
      : 'professional_slots';

    setDirectBookingItem({
      id: `direct-${studioId}-${date}`,
      time,
      name,
      price,
      duration,
      bookingDate: date,
      timeSlotId,
      bookingType,
    });
  // only run when search params string changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Complete Your Booking</h1>
          <p className="mt-2 text-gray-600">Fill in your details to confirm your studio reservation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left - Client Details (span 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Details Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Details</h2>

              <form id="bookingForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Full Name *</div>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="block w-full rounded-lg border-2 border-gray-200 focus:border-black focus:ring-0 px-4 py-3 transition-colors" 
                      placeholder="John Doe" 
                      required 
                    />
                  </label>
                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Email Address *</div>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="block w-full rounded-lg border-2 border-gray-200 focus:border-black focus:ring-0 px-4 py-3 transition-colors" 
                      placeholder="john@example.com" 
                      required 
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Phone Number</div>
                  <input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="block w-full rounded-lg border-2 border-gray-200 focus:border-black focus:ring-0 px-4 py-3 transition-colors" 
                    placeholder="+63 912 345 6789"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - Add manually if not provided</p>
                </label>

                {/* Policies */}
                <div className="space-y-4 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={acceptPolicy} 
                      onChange={(e) => setAcceptPolicy(e.target.checked)} 
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-black focus:ring-black" 
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">I have read and agree to the cancellation policy</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={allowCompanions} 
                      onChange={(e) => setAllowCompanions(e.target.checked)} 
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-black focus:ring-black" 
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">I understand that companions are only allowed in the waiting area outside the studio</span>
                  </label>
                </div>
              </form>
            </div>

            {/* Add-on Services Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add-on Services</h2>
              <p className="text-gray-600 mb-6">Enhance your studio experience with professional add-ons</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/pages/booking/checkout/select-professional?type=photographer')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-center hover:border-black transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="text-4xl mb-3">📸</div>
                  <h3 className="font-bold text-gray-900 mb-1">Photographer</h3>
                  <p className="text-xs text-gray-600">Professional photography services</p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/pages/booking/checkout/select-professional?type=editor')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-center hover:border-black transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="text-4xl mb-3">✍️</div>
                  <h3 className="font-bold text-gray-900 mb-1">Editor</h3>
                  <p className="text-xs text-gray-600">Photo editing & retouching</p>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/pages/booking/checkout/select-professional?type=makeup_artist')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-center hover:border-black transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="text-4xl mb-3">💄</div>
                  <h3 className="font-bold text-gray-900 mb-1">Make-up Artist</h3>
                  <p className="text-xs text-gray-600">Professional makeup services</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right - Booking Summary */}
          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 sm:p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>

              <div className="space-y-4 mb-6">
                {checkoutItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3 opacity-50">📅</div>
                    <p className="text-gray-400">No bookings yet</p>
                  </div>
                ) : (
                  checkoutItems.map((it) => (
                    <div key={it.id} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📸</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-white">{it.name}</div>
                          <div className="text-sm text-gray-300 mt-1">{it.time} • {it.duration}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {it.bookingDate ? new Date(it.bookingDate + 'T00:00:00').toLocaleDateString() : 'No date selected'}
                          </div>
                        </div>
                        <div className="font-bold text-white">{it.price}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {checkoutItems.length > 0 && (
                <>
                  <div className="border-t border-white/20 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tax</span>
                      <span>₱0.00</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-white pt-2 border-t border-white/20">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    form="bookingForm"
                    type="submit"
                    disabled={submitting}
                    className={`w-full mt-6 bg-white text-black px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100 transform hover:scale-105 active:scale-95'
                    }`}
                  >
                    {submitting ? 'Processing...' : 'Complete Booking'}
                  </button>

                  <p className="mt-4 text-xs text-gray-400 text-center">
                    By completing your booking, you agree to receive related notifications
                  </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
