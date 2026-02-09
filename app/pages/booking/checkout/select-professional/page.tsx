'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cartContext';
import { photographers, editors, makeupArtists, Professional } from '@/lib/professionalsData';

export default function SelectProfessionalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const [professionalType, setProfessionalType] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pageTitle, setPageTitle] = useState('Select Professional');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setProfessionalType(type);
      let data: Professional[] = [];
      let title = '';
      switch (type) {
        case 'photographer':
          data = photographers;
          title = 'Select a Photographer';
          break;
        case 'editor':
          data = editors;
          title = 'Select an Editor';
          break;
        case 'makeup_artist':
          data = makeupArtists;
          title = 'Select a Make-up Artist';
          break;
        default:
          router.push('/pages/booking/checkout'); // Redirect if type is invalid
          return;
      }
      setProfessionals(data);
      setPageTitle(title);
    } else {
      router.push('/pages/booking/checkout'); // Redirect if no type is provided
    }
  }, [searchParams, router]);

  const handleSelectProfessional = (pro: Professional) => {
    const serviceItem = {
      id: pro.id,
      name: `${pro.type.charAt(0).toUpperCase() + pro.type.slice(1)}: ${pro.name}`,
      price: `₱${pro.rate}`,
      duration: '', // Duration might vary or not apply
      time: pro.availability, // Using availability as time for now
    };
    addItem(serviceItem);
    alert(`${pro.name} (${pro.type}) added to cart for ₱${pro.rate}!`);
    router.push('/pages/booking/checkout'); // Go back to checkout page
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>

        <div className="space-y-4">
          {professionals.length === 0 ? (
            <p className="text-gray-500">No professionals available for this category.</p>
          ) : (
            professionals.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between transition-colors gap-4" // Changed to horizontal flex
              >
                <div className="flex-grow"> {/* Details take up available space */}
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
                    <span className="text-md font-bold text-gray-900">₱{p.rate}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{p.description}</p>
                  <p className="text-xs text-gray-500">Availability: {p.availability}</p>
                </div>
                <button
                  onClick={() => handleSelectProfessional(p)}
                  className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors" // Button on the right
                >
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/pages/booking/checkout')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
