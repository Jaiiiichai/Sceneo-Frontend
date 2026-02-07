'use client';

import { CheckCircle } from 'lucide-react';

export default function HowItWorks() {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
                    <p className="text-xl text-gray-600">Book your perfect photo studio in three simple steps</p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                            1
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Browse & Choose</h3>
                        <p className="text-gray-600">
                            Explore our collection of professional photo studios. Filter by location, amenities, and hourly rates to find the perfect fit for your needs.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                            2
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Select & Book</h3>
                        <p className="text-gray-600">
                            Pick your dates and times, optionally add a professional photographer, and complete your booking securely online.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                            3
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Create & Enjoy</h3>
                        <p className="text-gray-600">
                            Arrive at your booked time and create amazing photos! Our team is ready to assist with equipment and technical support.
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-gray-50 rounded-lg p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Book With Us</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex gap-3">
                            <CheckCircle className="w-6 h-6 text-black flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">Verified Studios</p>
                                <p className="text-gray-600 text-sm">All studios are professionally reviewed and verified</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <CheckCircle className="w-6 h-6 text-black flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">Expert Photographers</p>
                                <p className="text-gray-600 text-sm">Book skilled photographers for your shoot</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <CheckCircle className="w-6 h-6 text-black flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">Secure Booking</p>
                                <p className="text-gray-600 text-sm">Protected payments and cancellation guarantee</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <CheckCircle className="w-6 h-6 text-black flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">24/7 Support</p>
                                <p className="text-gray-600 text-sm">Our team is always here to help you</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
