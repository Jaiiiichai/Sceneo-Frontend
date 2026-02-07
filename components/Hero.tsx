'use client';

import Link from 'next/link';

export default function Hero() {
    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Left Side - Title & Tagline */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
                                Book Your Perfect Photo Studio
                            </h1>
                            <p className="text-xl text-gray-600 mb-6">
                                Professional photo studio rental and photographer booking services. Get the perfect space and talent for your photoshoots, whether you are a professional or just starting out.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                href="pages/booking"
                                className="bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
                            >
                                Book Studio
                            </Link>
                            <Link
                                href="/rent"
                                className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
                            >
                                Book Photographer
                            </Link>
                        </div>

                        <div className="pt-8 flex gap-8">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">Premium</p>
                                <p className="text-gray-600">Studio Spaces</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">Expert</p>
                                <p className="text-gray-600">Photographers</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">24/7</p>
                                <p className="text-gray-600">Support</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Visual */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-md">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Card 1 */}
                                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="text-4xl mb-3">📸</div>
                                    <h3 className="font-bold text-gray-900 mb-2">Professional Studio</h3>
                                    <p className="text-sm text-gray-600">State-of-the-art equipment and lighting</p>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="text-4xl mb-3">👥</div>
                                    <h3 className="font-bold text-gray-900 mb-2">Expert Team</h3>
                                    <p className="text-sm text-gray-600">Experienced photographers ready to assist</p>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="text-4xl mb-3">⏰</div>
                                    <h3 className="font-bold text-gray-900 mb-2">Flexible Hours</h3>
                                    <p className="text-sm text-gray-600">Book anytime that works for you</p>
                                </div>

                                {/* Card 4 */}
                                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="text-4xl mb-3">✨</div>
                                    <h3 className="font-bold text-gray-900 mb-2">High Quality</h3>
                                    <p className="text-sm text-gray-600">Professional results guaranteed</p>
                                </div>
                            </div>

                            {/* Feature Highlight */}
                            <div className="mt-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 text-white shadow-lg">
                                <p className="text-sm font-semibold mb-2">Why Choose Us</p>
                                <p className="text-lg font-bold">Everything you need for stunning photos in one place</p>
                                <div className="mt-4 flex gap-2 text-sm">
                                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">Studio Space</span>
                                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">Photographers</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}