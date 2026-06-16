"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useCart } from "@/lib/cartContext";
import { clearPendingPaymentBooking, getPendingPaymentBooking } from "@/lib/pendingPaymentBooking";
import { useToast } from "@/lib/toastContext";
import { paymongoService } from "@/network/services/paymongoService";

const PAYMENT_STORAGE_EVENT = "sceneo:pending-payment-updated";

export default function GlobalPaymentMonitor() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { removeItem } = useCart();
  const { showToast } = useToast();
  const [trackedPaymongoLinkId, setTrackedPaymongoLinkId] = useState<string | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);

  useEffect(() => {
    const loadPendingPayment = () => {
      const pendingDraft = getPendingPaymentBooking();
      setTrackedPaymongoLinkId(pendingDraft?.paymentLinkId ? String(pendingDraft.paymentLinkId) : null);
    };

    loadPendingPayment();

    window.addEventListener(PAYMENT_STORAGE_EVENT, loadPendingPayment);
    window.addEventListener("focus", loadPendingPayment);
    document.addEventListener("visibilitychange", loadPendingPayment);

    return () => {
      window.removeEventListener(PAYMENT_STORAGE_EVENT, loadPendingPayment);
      window.removeEventListener("focus", loadPendingPayment);
      document.removeEventListener("visibilitychange", loadPendingPayment);
    };
  }, []);

  useEffect(() => {
    if (!trackedPaymongoLinkId || !isAuthenticated()) return;

    let cancelled = false;
    let pollTimeoutId: number | null = null;

    const pollPaymongoLinkStatus = async () => {
      if (cancelled) return;

      try {
        const result = await paymongoService.syncPaymentLink(trackedPaymongoLinkId);

        if (result.status === "paid") {
          if (!cancelled) {
            const pendingDraft = getPendingPaymentBooking();
            clearPendingPaymentBooking();
            if (pendingDraft?.cartItemId) {
              await removeItem(pendingDraft.cartItemId);
            }
            setTrackedPaymongoLinkId(null);
            setShowPaymentSuccessModal(true);
            showToast("Payment confirmed. Your booking is paid.", "success");
          }
          return;
        }

        if (result.status === "final_unpaid") {
          if (!cancelled) {
            clearPendingPaymentBooking();
            setTrackedPaymongoLinkId(null);
            showToast("Payment was not completed. Please try again.", "error");
          }
          return;
        }
      } catch (error) {
        console.error("Failed to sync PayMongo payment link:", error);
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
  }, [isAuthenticated, removeItem, showToast, trackedPaymongoLinkId]);

  if (!showPaymentSuccessModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 border border-slate-200 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-2xl font-bold text-slate-950 mb-3">Payment Successful</h3>
        <p className="text-slate-700 text-lg leading-relaxed mb-8">
          Your booking is done and payment was received successfully.
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
