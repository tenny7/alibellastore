"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, XCircle, Loader2, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type PaymentState =
  | "idle"
  | "initiating"
  | "polling"
  | "success"
  | "failed"
  | "timed_out";

interface Props {
  orderId: string;
  orderNumber: string;
  amount: number;
  onSuccess: () => void;
  currencyCode?: string;
}

const POLL_INTERVAL = 5000;
const MAX_POLL_TIME = 120000; // 2 minutes

export function MoMoPaymentButton({
  orderId,
  orderNumber,
  amount,
  onSuccess,
  currencyCode = "RWF",
}: Props) {
  const [state, setState] = useState<PaymentState>("idle");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Poll for payment status
  const pollStatus = useCallback(
    async (refId: string) => {
      try {
        const res = await fetch(`/api/payments/momo/status/${refId}`);
        const data = await res.json();

        if (data.status === "SUCCESSFUL") {
          stopPolling();
          setState("success");
          toast.success("Payment successful!");
          onSuccess();
        } else if (data.status === "FAILED") {
          stopPolling();
          setState("failed");
          setErrorMessage("Payment was declined. Please try again.");
          toast.error("Payment failed.");
        } else if (Date.now() - pollStartRef.current > MAX_POLL_TIME) {
          stopPolling();
          setState("timed_out");
          setErrorMessage(
            "Payment timed out. Check your phone and try again."
          );
          toast.error("Payment timed out.");
        }
      } catch {
        // Network error — keep polling, don't fail yet
      }
    },
    [onSuccess, stopPolling]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  async function initiatePayment() {
    setState("initiating");
    setErrorMessage("");

    try {
      const res = await fetch("/api/payments/momo/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("failed");
        setErrorMessage(data.details || data.error || "Failed to initiate payment");
        toast.error(data.error || "Payment initiation failed");
        return;
      }

      setReferenceId(data.referenceId);
      setState("polling");
      pollStartRef.current = Date.now();

      // Start polling every 5 seconds
      pollTimerRef.current = setInterval(
        () => pollStatus(data.referenceId),
        POLL_INTERVAL
      );
    } catch {
      setState("failed");
      setErrorMessage("Network error. Please check your connection.");
      toast.error("Failed to connect to payment service");
    }
  }

  if (state === "success") {
    return (
      <div className="text-center py-4 bg-green-50 border border-green-200 rounded-lg p-6">
        <CheckCircle className="h-12 w-12 mx-auto text-[#16A34A]" />
        <p className="mt-3 font-medium text-[#16A34A]">Payment Successful!</p>
        <p className="text-sm text-gray-500 mt-1">
          Redirecting to confirmation...
        </p>
      </div>
    );
  }

  if (state === "failed" || state === "timed_out") {
    return (
      <div className="text-center py-4 bg-red-50 border border-red-200 rounded-lg p-6">
        <XCircle className="h-12 w-12 mx-auto text-[#DC2626]" />
        <p className="mt-3 font-medium text-[#DC2626]">
          {state === "timed_out" ? "Payment Timed Out" : "Payment Failed"}
        </p>
        {errorMessage && (
          <p className="text-sm text-gray-500 mt-1">{errorMessage}</p>
        )}
        <button
          onClick={() => {
            setState("idle");
            setReferenceId(null);
            setErrorMessage("");
          }}
          className="mt-4 px-6 py-2 bg-[#FFCB05] text-black rounded-lg font-medium hover:bg-[#E6B800]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (state === "polling") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <Loader2 className="h-16 w-16 text-[#FFCB05] animate-spin" />
          <Phone className="h-6 w-6 text-[#1E293B] absolute inset-0 m-auto" />
        </div>
        <div>
          <p className="font-medium text-[#1E293B]">
            Approve the payment on your phone
          </p>
          <p className="text-sm text-gray-500 mt-1">
            A payment request of {formatCurrency(amount, currencyCode)} has been sent to your
            MTN MoMo account. Please check your phone and enter your PIN to
            approve.
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Waiting for confirmation...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="bg-[#FFF8E1] border border-[#FFECB3] rounded-lg p-4">
        <p className="text-sm text-[#1E293B]">
          Click below to send a payment request of{" "}
          <strong>{formatCurrency(amount, currencyCode)}</strong> to your MTN MoMo account.
          You will receive a prompt on your phone to approve.
        </p>
      </div>
      <Button
        onClick={initiatePayment}
        loading={state === "initiating"}
        className="w-full bg-[#FFCB05] hover:bg-[#E6B800] text-black font-semibold py-3"
        size="lg"
      >
        {state === "initiating" ? "Sending request..." : `Pay ${formatCurrency(amount, currencyCode)} with MoMo`}
      </Button>
      <p className="text-xs text-gray-400">
        Order #{orderNumber}
      </p>
    </div>
  );
}
