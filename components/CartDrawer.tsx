'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag, Camera } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { setCheckoutDraft } from '@/lib/checkoutDraft';

export default function CartDrawer() {
  const { items, removeItem, isOpen, setIsOpen } = useCart();
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || items[0] || null,
    [items, selectedItemId]
  );

  const selectedTotal = parseFloat(selectedItem?.price.replace(/[^0-9.]/g, '') || '0') || 0;

  const handleProceedToCheckout = () => {
    if (!selectedItem) return;
    setCheckoutDraft(selectedItem);
    setIsOpen(false);
    router.push('/pages/booking/checkout');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-900">
          <div className="flex items-center gap-3">
            <ShoppingBag size={28} className="text-gray-900" />
            <h2 className="text-3xl font-black text-gray-900">Your Cart</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X size={28} className="text-gray-900" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gray-100 rounded-full p-8 mb-6">
                <ShoppingBag size={64} className="text-gray-400" />
              </div>
              <p className="text-gray-900 text-xl font-bold mb-2">Your cart is empty</p>
              <p className="text-gray-500 text-sm">Add studio bookings to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => {
                const selected = item.id === selectedItem?.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full text-left border-2 rounded-xl p-5 transition-colors ${
                      selected ? 'border-gray-950 bg-gray-50' : 'border-gray-200 hover:border-gray-900'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span
                          className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            selected ? 'border-gray-950' : 'border-gray-300'
                          }`}
                          aria-hidden="true"
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-gray-950" />}
                        </span>
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Camera size={18} className="text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.time}</p>
                          {item.bookingDate && (
                            <p className="text-xs text-gray-500 mt-1">{item.bookingDate}</p>
                          )}
                          {selected && (
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mt-2">
                              Selected for checkout
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        aria-label="Remove item"
                      >
                        <Trash2 size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-600">{item.duration}</span>
                      <span className="text-xl font-bold text-gray-900">{item.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t-2 border-gray-900 p-6 space-y-6 bg-gray-50">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-600">Selected Booking</span>
                <span className="text-3xl font-black text-gray-900">₱{selectedTotal.toFixed(2)}</span>
              </div>
              {items.length > 1 && (
                <p className="mt-2 text-xs font-medium text-gray-500">
                  Checkout is limited to one booking at a time.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleProceedToCheckout}
                disabled={!selectedItem}
                className="block text-center w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                Checkout Selected Booking
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full border-2 border-gray-900 text-gray-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
