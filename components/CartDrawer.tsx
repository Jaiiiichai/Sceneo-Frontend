'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, Trash2, ShoppingBag, Camera } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { setSelectedCheckoutItemIds } from '@/lib/checkoutDraft';
import { getPhotographyAddonPackagePricing } from '@/lib/photographyAddonPackages';

export default function CartDrawer() {
  const { items, removeItem, updateItemQuantity, isOpen, setIsOpen } = useCart();
  const router = useRouter();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const previousItemIdsRef = useRef<string[]>([]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.includes(item.id)),
    [items, selectedItemIds]
  );
  const getItemQuantity = (item: typeof items[number]) => Math.max(1, Number(item.quantity || 1));
  const getItemBaseTotal = (item: typeof items[number]) => parseFloat(item.price.replace(/[^0-9.]/g, '') || '0') || 0;
  const getItemAddons = (item: typeof items[number]) => item.serviceAddons || [];
  const cartAddonPricing = getPhotographyAddonPackagePricing(items, getItemAddons);
  const selectedAddonPricing = getPhotographyAddonPackagePricing(selectedItems, getItemAddons);
  const getItemDisplayTotal = (item: typeof items[number]) => getItemBaseTotal(item) + cartAddonPricing.getItemAddonTotal(item);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + getItemBaseTotal(item), 0) + selectedAddonPricing.total;
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  useEffect(() => {
    const previousIds = previousItemIdsRef.current;
    const availableIds = items.map((item) => item.id);

    setSelectedItemIds((currentIds) => {
      const keptIds = currentIds.filter((id) => availableIds.includes(id));
      const newIds = availableIds.filter((id) => !previousIds.includes(id));
      return [...keptIds, ...newIds];
    });

    previousItemIdsRef.current = availableIds;
  }, [items]);

  const toggleSelectedItem = (itemId: string) => {
    setSelectedItemIds((currentIds) => (
      currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId]
    ));
  };

  const handleProceedToCheckout = () => {
    if (selectedItemIds.length === 0) return;
    setSelectedCheckoutItemIds(selectedItemIds);
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
                const selected = selectedItemIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`w-full text-left border-2 rounded-xl p-5 transition-colors ${
                      selected ? 'border-gray-950 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-900'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <label className="mt-1 flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelectedItem(item.id)}
                            className="h-5 w-5 rounded border-gray-300 text-gray-950 focus:ring-gray-950"
                            aria-label={`Select ${item.name} for checkout`}
                          />
                        </label>
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Camera size={18} className="text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.time}</p>
                          {item.bookingDate && (
                            <p className="text-xs text-gray-500 mt-1">{item.bookingDate}</p>
                          )}
                          {getItemAddons(item).length > 0 && (
                            <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Add-ons</p>
                              {getItemAddons(item).map((addon, addonIndex) => (
                                <div
                                  key={`${addon.serviceType}-${addon.providerId}-${addon.durationMinutes || 'na'}-${addon.startOffsetMinutes ?? 'na'}-${addonIndex}`}
                                  className="flex items-start justify-between gap-3 text-xs text-slate-700"
                                >
                                  <span>
                                    {addon.providerName}
                                    {addon.durationMinutes ? ` (${addon.durationMinutes} min)` : ''}
                                  </span>
                                  <span className="font-bold">
                                    {addon.quoteRequired ? 'Quote' : `₱${Number(addon.providerRate || 0).toLocaleString()}`}
                                  </span>
                                </div>
                              ))}
                            </div>
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
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, Number(item.quantity || 1) - 1)}
                            className="p-2 text-gray-700 hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 px-2 text-center text-sm font-black text-gray-900">
                            {Number(item.quantity || 1)}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, Number(item.quantity || 1) + 1)}
                            className="p-2 text-gray-700 hover:bg-gray-100"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-xl font-bold text-gray-900">₱{getItemDisplayTotal(item).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t-2 border-gray-900 p-6 space-y-6 bg-gray-50">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-600">Cart Total</span>
                <span className="text-3xl font-black text-gray-900">₱{selectedTotal.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500">
                {selectedQuantity} {selectedQuantity === 1 ? 'booking' : 'bookings'} selected for checkout.
              </p>
              {selectedAddonPricing.savings > 0 && (
                <div className="mt-3 space-y-1 rounded-lg border border-teal-100 bg-teal-50 p-3">
                  {selectedAddonPricing.appliedPackages.map((pkg) => (
                    <div key={`${pkg.groupKey}-${pkg.minutes}`} className="text-xs text-teal-900">
                      <div className="flex items-center justify-between gap-3 font-black">
                        <span>{pkg.providerName} - {pkg.displayDuration}</span>
                        <span>₱{pkg.price.toLocaleString()}</span>
                      </div>
                      <p className="mt-1 font-bold text-teal-700">
                        Package applied for {pkg.addonCount} photography add-ons. You saved ₱{pkg.savings.toLocaleString()}.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleProceedToCheckout}
                disabled={selectedItemIds.length === 0}
                className="block text-center w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                Checkout Selected Bookings
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
