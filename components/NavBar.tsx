"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import CartDrawer from "./CartDrawer";

export default function NavBar() {
    const [open, setOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const isAdminRoute = pathname?.startsWith('/admin');
    const { items, setIsOpen } = useCart();
    const { user, logout } = useAuth();
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    if (isAdminRoute) {
        return null;
    }

    return (
        <header className={`${isHomePage ? 'absolute top-0 left-0 right-0 z-40' : 'sticky top-0 z-40'} bg-transparent px-4 sm:px-6 lg:px-8 pt-4`}>
            <nav
                className={`mx-auto w-full max-w-6xl rounded-2xl px-4 sm:px-6 shadow-lg ${
                    isHomePage
                        ? 'border border-white/70 bg-white/35 backdrop-blur-md shadow-slate-900/10'
                        : 'border border-white/70 bg-white/35 backdrop-blur-md shadow-slate-900/10'
                }`}
            >
                <div className="h-16 relative flex items-center">
                    <button
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-label="Toggle menu"
                        className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-3 md:gap-6 ml-2 md:ml-0">
                        <Link href="/" className="text-2xl font-bold text-slate-900 tracking-tight">
                            Sceneo
                        </Link>

                        <div className="relative group hidden md:block">
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 px-3 py-2 text-lg font-semibold text-slate-800 hover:text-slate-950"
                            >
                                Book
                                <ChevronDown size={18} className="mt-0.5" />
                            </button>
                            <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-40">
                                <div className="w-52 rounded-xl border border-slate-200 bg-white shadow-lg py-2">
                                    <Link
                                        href="/pages/booking?bookingType=whole_studio"
                                        className="block px-4 py-2 text-sm text-slate-700 rounded-md mx-2 hover:bg-indigo-100 hover:text-indigo-900 hover:font-semibold transition-colors"
                                    >
                                        Book Whole Studio
                                    </Link>
                                    <Link
                                        href="/pages/booking?bookingType=slot"
                                        className="block px-4 py-2 text-sm text-slate-700 rounded-md mx-2 hover:bg-indigo-100 hover:text-indigo-900 hover:font-semibold transition-colors"
                                    >
                                        Book a Slot
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => setIsOpen(true)}
                                className="text-gray-600 hover:text-gray-900 relative"
                            >
                                <ShoppingCart size={24} />
                                {items.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {items.length}
                                    </span>
                                )}
                            </button>
                 
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    >
                                        <Image
                                            src={user.avatar || ''}
                                            alt={user.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full border-2 border-gray-300"
                                        />
                                    </button>
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                            <Link
                                                href="/pages/profile"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                href="/pages/bookings"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                My Bookings
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/pages/Auth/login"
                                    className="bg-black text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-900"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="md:hidden mt-2 pb-4 border-t border-gray-100">
                        <div className="flex flex-col px-2">
                            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Book</p>
                            <Link
                                href="/pages/booking?bookingType=whole_studio"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-gray-700 rounded-md hover:bg-indigo-100 hover:text-indigo-900 hover:font-semibold transition-colors"
                            >
                                Book Whole Studio
                            </Link>
                            <Link
                                href="/pages/booking?bookingType=slot"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-gray-700 rounded-md hover:bg-indigo-100 hover:text-indigo-900 hover:font-semibold transition-colors"
                            >
                                Book a Slot
                            </Link>

                            <Link
                                href="/pages/booking"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Browse Studios
                            </Link>
                            
                            {user ? (
                                <>
                                    <div className="border-t border-gray-200 mt-2 pt-2">
                                        <div className="flex items-center gap-3 px-3 py-2">
                                            <Image
                                                src={user.avatar || ''}
                                                alt={user.name}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-full border-2 border-gray-300"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href="/pages/profile"
                                        onClick={() => setOpen(false)}
                                        className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        href="/pages/bookings"
                                        onClick={() => setOpen(false)}
                                        className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        My Bookings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setOpen(false);
                                        }}
                                        className="w-full text-left py-2 px-3 text-red-600 rounded-md hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/pages/Auth/login"
                                    onClick={() => setOpen(false)}
                                    className="block mt-2 py-2 px-3 bg-black text-white rounded-md text-center"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            
            {/* Cart Drawer */}
            <CartDrawer />
        </header>
    );
}