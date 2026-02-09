'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cartContext';

export default function BookingCheckoutPage() {
  const { items, clearCart, setIsOpen, addItem } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(true);
  const [allowCompanions, setAllowCompanions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((sum, it) => sum + parseFloat(it.price.replace(/[^0-9.]/g, '')), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || items.length === 0) return alert('Please provide name, email and at least one booking item');
    if (!acceptPolicy) return alert('Please agree to the cancellation policy');
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    alert(`Booking confirmed for ${name}. Total: ₱${total.toFixed(2)}`);
    clearCart();
    setIsOpen(false);
    router.push('/');
  };

  useEffect(() => {
    if (!searchParams) return;
    const studioId = searchParams.get('studioId');
    if (studioId) {
      const exists = items.find((it) => it.id === studioId);
      if (!exists) {
        const time = searchParams.get('time') || '';
        const name = searchParams.get('name') || 'Studio Booking';
        const price = searchParams.get('price') || '₱0';
        const duration = searchParams.get('duration') || '';
        addItem({ id: studioId, time, name, price, duration });
      }
    }
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
                  <div className="text-sm font-semibold text-gray-700 mb-2">Phone Number *</div>
                  <input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="block w-full rounded-lg border-2 border-gray-200 focus:border-black focus:ring-0 px-4 py-3 transition-colors" 
                    placeholder="+63 912 345 6789" 
                    required
                  />
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
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3 opacity-50">📅</div>
                    <p className="text-gray-400">No bookings yet</p>
                  </div>
                ) : (
                  items.map((it) => (
                    <div key={it.id} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📸</div>
                        <div className="flex-grow">
                          <div className="font-semibold text-white">{it.name}</div>
                          <div className="text-sm text-gray-300 mt-1">{it.time} • {it.duration}</div>
                          <div className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div className="font-bold text-white">{it.price}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
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
