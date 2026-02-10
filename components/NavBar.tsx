"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import CartDrawer from "./CartDrawer";

export default function NavBar() {
    const [open, setOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
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

    return (
        <header className="bg-white border-gray-200">
            <nav className="max-w-full 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                <div className="h-16 flex items-center justify-between">
                 

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
                                                href="/profile"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                href="/bookings"
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
                                    className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-900"
                                >
                                    Login
                                </Link>
                            )}
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
                                        href="/profile"
                                        onClick={() => setOpen(false)}
                                        className="block py-2 px-3 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        href="/bookings"
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