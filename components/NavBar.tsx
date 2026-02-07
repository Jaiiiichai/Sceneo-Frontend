"use client";

import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function NavBar() {
    const [open, setOpen] = useState(false);

    return (
        <header className="bg-gradient-to-br from-gray-50 to-gray-100">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center">
                    <Link href="/" className="text-2xl font-bold text-gray-900">
                        Sceneo
                    </Link>

                    <div className="hidden md:flex items-center gap-8 ml-8">
                        <Link href="/browse" className="text-gray-700 hover:text-gray-900">
                            Browse Studios
                        </Link>
                        <Link href="/photographers" className="text-gray-700 hover:text-gray-900">
                            Photographers
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/cart" className="text-gray-600 hover:text-gray-900">
                                <ShoppingCart size={30} />
                            </Link>
                 
                            <Link
                                href="/login"
                                className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-900"
                            >
                                Login
                            </Link>
                        </div>

                        <button
                            onClick={() => setOpen(!open)}
                            aria-expanded={open}
                            aria-label="Toggle menu"
                            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
                        >
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="md:hidden mt-2 pb-4 border-t border-gray-100">
                        <div className="flex flex-col px-2">
                            <Link
                                href="/browse"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Browse Studios
                            </Link>
                            <Link
                                href="/photographers"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Photographers
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Login
                            </Link>
                            <Link
                                href="/book"
                                onClick={() => setOpen(false)}
                                className="block mt-2 py-2 px-3 bg-black text-white rounded-md text-center"
                            >
                                Book Now
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}