"use client";

import { useMemo, useState } from "react";
import type { Currency } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/site";

type TicketTier = {
  id: string;
  name: string;
  priceAmount: number;
  currency: Currency;
  quantityTotal: number;
  quantitySold: number | null;
  quantityReserved: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  maxPerOrder: number | null;
};

type TicketSelectorProps = {
  tickets: TicketTier[];
};

function getAvailability(ticket: TicketTier) {
  return Math.max(
    ticket.quantityTotal -
      (ticket.quantitySold ?? 0) -
      (ticket.quantityReserved ?? 0),
    0,
  );
}

function getSaleState(ticket: TicketTier, now: Date) {
  if (ticket.saleEndsAt && ticket.saleEndsAt < now) {
    return "ended";
  }

  if (ticket.saleStartsAt && ticket.saleStartsAt > now) {
    return "upcoming";
  }

  return "active";
}

export function TicketSelector({ tickets }: TicketSelectorProps) {
  const now = new Date();
  const currencies = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.currency))],
    [tickets],
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    currencies[0] ?? null,
  );
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const filteredTickets = tickets.filter(
    (ticket) => !selectedCurrency || ticket.currency === selectedCurrency,
  );

  const currentTotal = filteredTickets.reduce((sum, ticket) => {
    const qty = qtyById[ticket.id] ?? 0;
    return sum + qty * ticket.priceAmount;
  }, 0);

  const handleAdjust = (ticket: TicketTier, delta: number) => {
    const availability = getAvailability(ticket);
    const limit = Math.min(ticket.maxPerOrder ?? availability, availability);
    const currentValue = qtyById[ticket.id] ?? 0;
    const nextValue = Math.max(0, Math.min(limit, currentValue + delta));

    setQtyById((previous) => ({
      ...previous,
      [ticket.id]: nextValue,
    }));
  };

  const showMultiCurrencyNotice = currencies.length > 1;
  const totalSelected = Object.values(qtyById).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  return (
    <div className="space-y-4">
      {showMultiCurrencyNotice ? (
        <p className="rounded border border-border bg-navy-tint px-3 py-2 text-sm text-navy">
          This event sells tickets in more than one currency. Please choose one
          currency at a time.
        </p>
      ) : null}

      {currencies.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {currencies.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => setSelectedCurrency(currency)}
              className={[
                "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                selectedCurrency === currency
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-white text-navy hover:border-navy/50",
              ].join(" ")}
            >
              {currency === "USD" ? "USD" : "ZiG"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredTickets.map((ticket) => {
          const availability = getAvailability(ticket);
          const saleState = getSaleState(ticket, now);
          const quantity = qtyById[ticket.id] ?? 0;
          const maxPerOrder = Math.min(
            ticket.maxPerOrder ?? availability,
            availability,
          );

          return (
            <div
              key={ticket.id}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-medium text-navy">
                    {ticket.name}
                  </p>
                  <div className="mt-1 text-sm text-navy/70">
                    <span>
                      {formatMoney(ticket.priceAmount, ticket.currency)}
                    </span>
                    {ticket.maxPerOrder ? (
                      <span className="ml-2">
                        Max {ticket.maxPerOrder} each
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-sm text-navy/70">
                  {availability === 0 ? (
                    <span className="font-medium text-red-600">Sold out</span>
                  ) : availability <= 10 ? (
                    <span className="font-medium text-teal">
                      Only {availability} left
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm text-navy/70">
                  {saleState === "upcoming" && ticket.saleStartsAt
                    ? `On sale from ${new Intl.DateTimeFormat("en-ZA", {
                        timeZone: "Africa/Harare",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(ticket.saleStartsAt)}`
                    : saleState === "ended"
                      ? "Sales ended"
                      : null}
                </div>

                <div className="flex items-center rounded-full border border-border bg-[#f8fafc]">
                  <button
                    type="button"
                    aria-label={`Decrease ${ticket.name}`}
                    onClick={() => handleAdjust(ticket, -1)}
                    disabled={quantity === 0}
                    className="min-h-11 min-w-11 rounded-l-full px-3 text-lg text-navy disabled:cursor-not-allowed disabled:text-navy/35"
                  >
                    −
                  </button>
                  <span className="min-w-12 text-center text-sm font-medium text-navy">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${ticket.name}`}
                    onClick={() => handleAdjust(ticket, 1)}
                    disabled={availability === 0 || quantity >= maxPerOrder}
                    className="min-h-11 min-w-11 rounded-r-full px-3 text-lg text-navy disabled:cursor-not-allowed disabled:text-navy/35"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-teal-tint p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-navy/70">Running total</p>
            <p className="text-xl font-medium text-navy">
              {formatMoney(
                currentTotal,
                selectedCurrency ?? tickets[0]?.currency ?? "USD",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setNotice(
                "Checkout is coming soon. Nothing has been reserved or charged.",
              )
            }
            disabled={totalSelected === 0}
            className="min-h-11 rounded-full bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/30"
          >
            Continue
          </button>
        </div>

        {notice ? (
          <p className="mt-3 rounded border border-teal/20 bg-white px-3 py-2 text-sm text-navy">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
