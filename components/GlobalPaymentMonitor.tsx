"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useCart } from "@/lib/cartContext";
import { clearPendingPaymentBooking, getPendingPaymentBooking } from "@/lib/pendingPaymentBooking";
import { useToast } from "@/lib/toastContext";
import { paymongoService } from "@/network/services/paymongoService";
import bookingService from "@/network/services/bookingService";

const PAYMENT_STORAGE_EVENT = "sceneo:pending-payment-updated";

export default function GlobalPaymentMonitor() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { removeItem } = useCart();
  const { showToast } = useToast();
  const [trackedPaymongoLinkId, setTrackedPaymongoLinkId] = useState<string | null>(null);
  const [trackedPackageBookingIds, setTrackedPackageBookingIds] = useState<string[]>([]);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);

  useEffect(() => {
    const loadPendingPayment = () => {
      const pendingDraft = getPendingPaymentBooking();
      setTrackedPaymongoLinkId(pendingDraft?.paymentLinkId ? String(pendingDraft.paymentLinkId) : null);
      const bookingIds = pendingDraft?.bookingIds?.length
        ? pendingDraft.bookingIds
        : pendingDraft?.bookingId
          ? [pendingDraft.bookingId]
          : [];
      setTrackedPackageBookingIds(
        pendingDraft?.paymentType === "package" ? bookingIds.map(String) : []
      );
    };

    loadPendingPayment();

    window.addEventListener(PAYMENT_STORAGE_EVENT, loadPendingPayment);
    window.addEventListener("storage", loadPendingPayment);
    window.addEventListener("focus", loadPendingPayment);
    document.addEventListener("visibilitychange", loadPendingPayment);

    return () => {
      window.removeEventListener(PAYMENT_STORAGE_EVENT, loadPendingPayment);
      window.removeEventListener("storage", loadPendingPayment);
      window.removeEventListener("focus", loadPendingPayment);
      document.removeEventListener("visibilitychange", loadPendingPayment);
    };
  }, []);

  useEffect(() => {
    if ((!trackedPaymongoLinkId && trackedPackageBookingIds.length === 0) || !isAuthenticated()) return;

    let cancelled = false;
    let pollTimeoutId: number | null = null;

    const confirmSuccessfulPayment = async (status: "paid" | "addon_paid") => {
      const pendingDraft = getPendingPaymentBooking();
      clearPendingPaymentBooking();
      const cartItemIds = pendingDraft?.cartItemIds?.length
        ? pendingDraft.cartItemIds
        : pendingDraft?.cartItemId
          ? [pendingDraft.cartItemId]
          : [];

      for (const cartItemId of cartItemIds) {
        await removeItem(cartItemId);
      }

      setTrackedPaymongoLinkId(null);
      setTrackedPackageBookingIds([]);
      setShowPaymentSuccessModal(true);
      showToast(
        status === "addon_paid"
          ? "Payment confirmed. Your add-ons were added."
          : "Payment confirmed. Your booking is paid.",
        "success"
      );
    };

    const pollPaymongoLinkStatus = async () => {
      if (cancelled) return;

      try {
        const result = trackedPaymongoLinkId
          ? await paymongoService.syncPaymentLink(trackedPaymongoLinkId)
          : null;

        if (result?.status === "paid" || result?.status === "addon_paid") {
          if (!cancelled) {
            await confirmSuccessfulPayment(result.status);
          }
          return;
        }

        if (result?.status === "final_unpaid") {
          if (!cancelled) {
            clearPendingPaymentBooking();
            setTrackedPaymongoLinkId(null);
            setTrackedPackageBookingIds([]);
            showToast("Payment was not completed. Please try again.", "error");
          }
          return;
        }
      } catch {
      }

      if (trackedPackageBookingIds.length > 0) {
        try {
          const packageBookings = await Promise.all(
            trackedPackageBookingIds.map((bookingId) => bookingService.getBookingById(bookingId))
          );
          const allPaid = packageBookings.every((booking) => (
            booking.status === "paid" || booking.booking_status === "paid"
          ));

          if (allPaid && !cancelled) {
            await confirmSuccessfulPayment("paid");
            return;
          }
        } catch {
        }
      }

      pollTimeoutId = window.setTimeout(pollPaymongoLinkStatus, 5000);
    };

    pollPaymongoLinkStatus();

    return () => {
      cancelled = true;
      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId);
      }
    };
  }, [isAuthenticated, removeItem, showToast, trackedPaymongoLinkId, trackedPackageBookingIds]);

  if (!showPaymentSuccessModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 border border-slate-200 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-2xl font-bold text-slate-950 mb-3">Payment Successful</h3>
        <p className="text-slate-700 text-lg leading-relaxed mb-8">
          Your payment was received successfully.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowPaymentSuccessModal(false);
            router.push("/");
          }}
          className="w-full px-4 py-4 rounded-lg bg-slate-950 text-white text-lg font-bold hover:bg-slate-800"
        >
          Great
        </button>
      </div>
    </div>
  );
}

export { PAYMENT_STORAGE_EVENT };

