'use client';

import Link from 'next/link';
import { BookingType } from "@/lib/bookingContext";
import { CalendarCheck, Building, ArrowRight } from 'lucide-react';

interface HeroProps {
  setBookingType: (type: BookingType) => void;
}

export default function Hero({ setBookingType }: HeroProps) {
    return (
        <section className="min-h-screen bg-transparent flex items-center relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 md:pt-32 pb-12">
                <div className="text-center mb-12">
                    <h1 className="text-8xl md:text-9xl font-black text-slate-900 mb-8 tracking-tight">
                        SCENEO STUDIO
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6 tracking-tight">
                        Your Creative Space Awaits You
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto mb-12">
                        Professional photo studios and expert photographers, all in one place.
                        Book instantly and bring your vision to life.
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center gap-12 mb-16 flex-wrap">
                        <div>
                            <p className="text-3xl font-bold text-slate-900">Quality First</p>
                            <p className="text-slate-700">Premium Spaces</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-900">Verified</p>
                            <p className="text-slate-700">Professionals</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-900">Easy</p>
                            <p className="text-slate-700">Booking</p>
                        </div>
                    </div>
                </div>

                {/* Booking Options */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">
                        Choose Your Booking Type
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Slot Booking */}
                        <Link
                            href="/pages/booking"
                            onClick={() => setBookingType('slot')}
                            className="group relative bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-white/60 hover:border-indigo-300 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-indigo-900 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <CalendarCheck className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Book a Slot</h3>
                                <p className="text-slate-700 text-sm mb-4">
                                    Perfect for individual shoots. Choose your time slot and studio.
                                </p>
                                <div className="flex items-center gap-2 text-slate-900 font-semibold mt-auto">
                                    Start Booking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        {/* Whole Studio */}
                        <Link
                            href="/pages/booking"
                            onClick={() => setBookingType('whole_studio')}
                            className="group relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border-2 border-indigo-900 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                        >
                            <div className="absolute top-3 right-3">
                                <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2 py-1 rounded-full">POPULAR</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Building className="w-8 h-8 text-indigo-900" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Whole Studio</h3>
                                <p className="text-indigo-100 text-sm mb-4">
                                    Whole Studio access. Exclusive use for productions and events.
                                </p>
                                <div className="flex items-center gap-2 text-indigo-50 font-semibold mt-auto">
                                    Start Booking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
