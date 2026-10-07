"use client";

import { useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";

export interface TicketTypeItem {
  id: string;
  name: string;
  priceAmount: number;
  currency: string;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved: number;
}

interface TicketSelectorProps {
  eventId: string;
  eventTitle: string;
  ticketTypes: TicketTypeItem[];
}

export default function TicketSelector({
  eventId,
  eventTitle,
  ticketTypes,
}: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuantityChange = (
    id: string,
    delta: number,
    maxAvailable: number,
  ) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const selectedItems = ticketTypes
    .filter((tt) => (quantities[tt.id] || 0) > 0)
    .map((tt) => ({
      ticketTypeId: tt.id,
      name: tt.name,
      priceAmount: tt.priceAmount,
      quantity: quantities[tt.id],
    }));

  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const currency = (ticketTypes[0]?.currency as "USD" | "ZIG") || "USD";
  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.priceAmount * item.quantity,
    0,
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Select Tickets</h3>

      <div className="space-y-4">
        {ticketTypes.map((tt) => {
          const available =
            tt.quantityTotal - tt.quantitySold - tt.quantityReserved;
          const isSoldOut = available <= 0;
          const selectedQty = quantities[tt.id] || 0;

          return (
            <div
              key={tt.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50"
            >
              <div>
                <div className="font-semibold text-gray-900">{tt.name}</div>
                <div className="text-sm font-bold text-amber-600 mt-0.5">
                  {tt.currency} {tt.priceAmount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isSoldOut ? (
                    <span className="text-red-500 font-medium">Sold Out</span>
                  ) : (
                    `${available} available`
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSoldOut || selectedQty === 0}
                  onClick={() => handleQuantityChange(tt.id, -1, available)}
                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="w-6 text-center font-semibold text-gray-900">
                  {selectedQty}
                </span>
                <button
                  type="button"
                  disabled={isSoldOut || selectedQty >= available}
                  onClick={() => handleQuantityChange(tt.id, 1, available)}
                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Total
          </div>
          <div className="text-xl font-bold text-gray-900">
            {currency} {totalPrice.toFixed(2)}
          </div>
        </div>

        <button
          type="button"
          disabled={totalQuantity === 0}
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors shadow-md"
        >
          Checkout ({totalQuantity})
        </button>
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        currency={currency}
        items={selectedItems}
      />
    </div>
  );
}
