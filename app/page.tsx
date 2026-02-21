'use client';

import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import HeroDetails from "@/components/HeroDetails";
import Iridescence from "@/components/Iridescence";
import { useBookingType } from "@/lib/bookingContext";

export default function Home() {
  const { setBookingType } = useBookingType();

  return (
    <div className="overflow-x-hidden">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Iridescence
            color={[0.5, 0.6, 0.8]}
            mouseReact
            amplitude={0.1}
            speed={1}
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-white/35" />
        </div>

        <Hero setBookingType={setBookingType} />
        
        <section className="py-20 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Why Choose Sceneo
              </h2>
              <p className="text-xl text-slate-700 max-w-2xl mx-auto">
                Everything you need to create stunning photos in one place
              </p>
            </div>
            <HeroDetails />
          </div>
        </section>

        <HowItWorks />
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of creators who trust Sceneo for their photography needs
          </p>
          <div className="flex justify-center">
            <a
              href="/pages/booking"
              className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              Browse Studios
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

