"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, LogOut, ChevronDown, CalendarCheck, Building2 } from "lucide-react";
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
                className={`mx-auto w-full max-w-7xl rounded-lg px-4 sm:px-5 shadow-lg ${
                    isHomePage
                        ? 'border border-white/25 bg-white/16 text-white backdrop-blur-xl shadow-black/10'
                        : 'border border-slate-200 bg-white/90 text-slate-950 backdrop-blur-xl shadow-slate-900/5'
                }`}
            >
                <div className="h-16 relative flex items-center">
                    <button
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-label="Toggle menu"
                        className={`md:hidden rounded-lg p-2 ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-3 md:gap-6 ml-2 md:ml-0">
                        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isHomePage ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
                                S
                            </span>
                            <span>Sceneo</span>
                        </Link>

                        <div className="relative group hidden md:block">
                            <button
                                type="button"
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
                            >
                                Book
                                <ChevronDown size={18} className="mt-0.5" />
                            </button>
                            <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-40">
                                <div className="w-60 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                                    <Link
                                        href="/pages/booking?bookingType=whole_studio"
                                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                                    >
                                        <Building2 size={17} />
                                        Book Whole Studio
                                    </Link>
                                    <Link
                                        href="/pages/booking?bookingType=slot"
                                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                                    >
                                        <CalendarCheck size={17} />
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
                                className={`relative rounded-lg p-2 ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
                            >
                                <ShoppingCart size={24} />
                                {items.length > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
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
                                            className={`h-10 w-10 rounded-full border-2 ${isHomePage ? 'border-white/60' : 'border-slate-200'}`}
                                        />
                                    </button>
                                    {showUserMenu && (
                                        <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-slate-200 bg-white py-2 shadow-xl">
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
                                    className={`${isHomePage ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'} rounded-lg px-5 py-2.5 font-bold`}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className={`mt-2 border-t pb-4 md:hidden ${isHomePage ? 'border-white/20' : 'border-slate-200'}`}>
                        <div className="flex flex-col px-2">
                            <p className={`px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide ${isHomePage ? 'text-white/70' : 'text-slate-500'}`}>Book</p>
                            <Link
                                href="/pages/booking?bookingType=whole_studio"
                                onClick={() => setOpen(false)}
                                className={`rounded-lg px-3 py-2 font-semibold ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                                Book Whole Studio
                            </Link>
                            <Link
                                href="/pages/booking?bookingType=slot"
                                onClick={() => setOpen(false)}
                                className={`rounded-lg px-3 py-2 font-semibold ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100'}`}
                            >
                                Book a Slot
                            </Link>

                            <Link
                                href="/pages/booking"
                                onClick={() => setOpen(false)}
                                className={`rounded-lg px-3 py-2 font-semibold ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100'}`}
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
                                        className={`rounded-lg px-3 py-2 ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100'}`}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        href="/pages/bookings"
                                        onClick={() => setOpen(false)}
                                        className={`rounded-lg px-3 py-2 ${isHomePage ? 'text-white hover:bg-white/15' : 'text-slate-700 hover:bg-slate-100'}`}
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
