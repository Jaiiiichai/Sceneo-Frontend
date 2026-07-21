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
      const bookingId = pendingDraft?.bookingId || pendingDraft?.bookingIds?.[0];
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
      showToast(
        status === "addon_paid"
          ? "Payment confirmed. Your add-ons were added."
          : "Payment confirmed. Your booking is paid.",
        "success"
      );
      router.push(
        bookingId
          ? `/pages/payment-success?bookingId=${encodeURIComponent(String(bookingId))}`
          : "/pages/payment-success"
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

  return null;
}

export { PAYMENT_STORAGE_EVENT };

