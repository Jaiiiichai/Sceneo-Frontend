'use client';

import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

export default function CartDrawer() {
  const { items, removeItem, isOpen, setIsOpen } = useCart();
  const router = useRouter();

  const handleProceedToCheckout = () => {
    setIsOpen(false);
    router.push('/pages/booking/checkout');
  };

  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
    return sum + price;
  }, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
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

        {/* Cart Items */}
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
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-gray-900 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">📸</div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.time}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total and Checkout */}
        {items.length > 0 && (
          <div className="border-t-2 border-gray-900 p-6 space-y-6 bg-gray-50">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-600">Total Amount</span>
                <span className="text-3xl font-black text-gray-900">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleProceedToCheckout}
                className="block text-center w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95"
              >
                Proceed to Checkout
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
