'use client';

import { Search, Calendar, CheckCircle, Shield, Clock, Star } from 'lucide-react';

export default function HowItWorks() {
    return (
        <section className="py-20 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">How It Works</h2>
                    <p className="text-xl text-slate-700 max-w-2xl mx-auto">Book your perfect photo studio in three simple steps</p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
                    {/* Connection Line (hidden on mobile) */}
                    <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ top: '32px' }} />
                    
                    {/* Step 1 */}
                    <div className="relative flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-900 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold shadow-lg z-10">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Browse & Choose</h3>
                        <p className="text-slate-700">
                            Explore our collection of professional photo studios. Filter by location, amenities, and rates to find your perfect match.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-800 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold shadow-lg z-10">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Select & Book</h3>
                        <p className="text-slate-700">
                            Pick your dates and times, optionally add a professional photographer, and complete your booking securely online.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-700 text-white rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold shadow-lg z-10">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Create & Enjoy</h3>
                        <p className="text-slate-700">
                            Arrive at your booked time and create amazing photos! Our team is ready to assist with equipment and support.
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-10 shadow-lg border border-white/60">
                    <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">Why Book With Sceneo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-900 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900 mb-1">Verified Studios</p>
                                <p className="text-slate-700">All studios are professionally reviewed and verified for quality</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-800 rounded-xl flex items-center justify-center">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900 mb-1">Expert Photographers</p>
                                <p className="text-slate-700">Book skilled photographers for your shoot with verified portfolios</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900 mb-1">Secure Booking</p>
                                <p className="text-slate-700">Protected payments and flexible cancellation guarantee</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900 mb-1">24/7 Support</p>
                                <p className="text-slate-700">Our dedicated team is always here to help you succeed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
