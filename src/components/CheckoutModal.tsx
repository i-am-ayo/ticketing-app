"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SelectedItem {
  ticketTypeId: string;
  name: string;
  priceAmount: number;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  currency: "USD" | "ZIG";
  items: SelectedItem[];
}

export default function CheckoutModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  currency,
  items,
}: CheckoutModalProps) {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.priceAmount * item.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          buyerName,
          buyerPhone,
          buyerEmail: buyerEmail || undefined,
          currency,
          items: items.map((i) => ({
            ticketTypeId: i.ticketTypeId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete reservation");
      }

      // Redirect to confirmation page on success
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Complete Checkout
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 font-bold p-1 text-lg"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kudzai Moyo"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              EcoCash / WhatsApp Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +263771234567"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. kudzai@example.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Order Summary
            </h3>
            {items.map((item) => (
              <div
                key={item.ticketTypeId}
                className="flex justify-between text-sm py-1"
              >
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold text-gray-900">
                  {currency} {(item.priceAmount * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 mt-2 border-t border-gray-200">
              <span>Total Due</span>
              <span className="text-amber-600">
                {currency} {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-md"
          >
            {isSubmitting ? "Reserving Tickets..." : "Reserve & Proceed"}
          </button>
        </form>
      </div>
    </div>
  );
}
