"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import CartDrawer from "./CartDrawer";

export default function NavBar() {
    const [open, setOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
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

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        setOpen(false);
        router.push('/');
    };

    return (
        <header className={`${isHomePage ? 'absolute left-0 right-0 top-0' : 'sticky top-0 bg-[#e5e7eb]'} z-40 px-4 py-4 sm:px-6 lg:px-8`}>
            <nav
                className="mx-auto w-full max-w-7xl rounded-lg border border-slate-200 bg-white/95 px-4 text-slate-950 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:px-5"
            >
                <div className="h-16 relative flex items-center">
                    <button
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-label="Toggle menu"
                        className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-3 md:gap-6 ml-2 md:ml-0">
                        <Link href="/" className="flex items-center">
                            <span className="flex h-10 w-36 items-center overflow-hidden rounded-lg bg-transparent sm:w-48">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/sceneo logo.png?v=logo-refresh"
                                    alt="Sceneo Studio"
                                    className="h-auto w-full object-contain"
                                />
                            </span>
                        </Link>

                        <div className="hidden items-center gap-1 md:flex">
                            <Link href="/#studio-preview" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                                Studio Preview
                            </Link>
                            <Link href="/pages/booking?bookingType=slot" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                                Book a Slot
                            </Link>
                            <Link href="/pages/booking?bookingType=whole_studio" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                                Whole Studio
                            </Link>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => setIsOpen(true)}
                                className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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
                                            className="h-10 w-10 rounded-full border-2 border-slate-200"
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
                                                onClick={handleLogout}
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
                                    className="rounded-lg bg-slate-950 px-5 py-2.5 font-bold text-white hover:bg-slate-800"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="mt-2 border-t border-slate-200 pb-4 md:hidden">
                        <div className="flex flex-col px-2">
                            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Explore</p>
                            <Link
                                href="/#studio-preview"
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                Studio Preview
                            </Link>
                            <Link
                                href="/pages/booking?bookingType=whole_studio"
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                Book Whole Studio
                            </Link>
                            <Link
                                href="/pages/booking?bookingType=slot"
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                Book a Slot
                            </Link>

                            <Link
                                href="/pages/booking"
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
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
                                        className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        href="/pages/bookings"
                                        onClick={() => setOpen(false)}
                                        className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
                                    >
                                        My Bookings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
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


