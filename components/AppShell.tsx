"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import UserIridescenceBackground from "@/components/UserIridescenceBackground";
import { CartProvider } from "@/lib/cartContext";
import { BookingTypeProvider } from "@/lib/bookingContext";
import { AuthProvider } from "@/lib/authContext";
import GlobalPaymentMonitor from "@/components/GlobalPaymentMonitor";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <BookingTypeProvider>
        <CartProvider>
          <UserIridescenceBackground />
          <div className="relative z-10">
            <NavBar />
            {children}
            <GlobalPaymentMonitor />
          </div>
        </CartProvider>
      </BookingTypeProvider>
    </AuthProvider>
  );
}
