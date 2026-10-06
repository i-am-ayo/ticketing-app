import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCategory, EventStatus } from "@/generated/prisma/client";
import { TicketSelector } from "@/components/TicketSelector";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, formatHarareDateTime, formatMoney, t } from "@/lib/site";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  [EventCategory.CONCERT]: "Concert",
  [EventCategory.PARTY]: "Party",
  [EventCategory.COMEDY]: "Comedy",
  [EventCategory.CONFERENCE]: "Conference",
  [EventCategory.SPORT]: "Sport",
};

function getAvailability(ticket: {
  quantityTotal: number;
  quantitySold: number | null;
  quantityReserved: number | null;
}) {
  return Math.max(
    ticket.quantityTotal -
      (ticket.quantitySold ?? 0) -
      (ticket.quantityReserved ?? 0),
    0,
  );
}

function getTicketStatus(ticket: {
  quantityTotal: number;
  quantitySold: number | null;
  quantityReserved: number | null;
}) {
  const available = getAvailability(ticket);
  if (available === 0) {
    return "Sold out";
  }
  if (available <= 10) {
    return `Only ${available} left`;
  }
  return null;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: {
        orderBy: { priceAmount: "asc" },
      },
    },
  });

  if (!event || event.status !== EventStatus.PUBLISHED || event.endsAt <= now) {
    notFound();
  }

  const ticketTypes = event.ticketTypes.map((ticket) => ({
    ...ticket,
    quantitySold: ticket.quantitySold ?? 0,
    quantityReserved: ticket.quantityReserved ?? 0,
  }));

  const currencies = [...new Set(ticketTypes.map((ticket) => ticket.currency))];

  return (
    <main className="mx-auto w-full max-w-md px-4 py-5 sm:max-w-5xl sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium text-navy"
        >
          {t("Back to events")}
        </Link>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-teal">
          {SITE_NAME}
        </p>
      </header>

      <article className="overflow-hidden rounded-3xl border border-border bg-white">
        <div className="flex min-h-40 items-center justify-center bg-navy-tint px-4 text-center text-xl font-medium uppercase tracking-[0.14em] text-navy">
          {CATEGORY_LABELS[event.category]}
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-teal-tint px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-teal">
              {CATEGORY_LABELS[event.category]}
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-medium text-navy">{event.title}</h1>
            <p className="mt-2 text-sm text-navy/70">
              {formatHarareDateTime(event.startsAt, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {" - "}
              {formatHarareDateTime(event.endsAt, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="mt-1 text-sm text-navy/70">
              {event.venue} · {event.city}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#f8fafc] p-4">
            <p className="text-sm uppercase tracking-[0.14em] text-teal">
              About
            </p>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-navy/80">
              {event.description || t("No description available yet.")}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-navy">
              {t("Ticket tiers")}
            </h2>
            {currencies.length > 1 ? (
              <p className="mt-2 text-sm text-navy/70">
                {t(
                  "This event sells tickets in more than one currency. Please choose one currency at a time.",
                )}
              </p>
            ) : null}
            <div className="mt-4 space-y-3">
              {ticketTypes.map((ticket) => {
                const availability = getAvailability(ticket);
                const saleStartsAt = ticket.saleStartsAt
                  ? new Date(ticket.saleStartsAt)
                  : null;
                const saleEndsAt = ticket.saleEndsAt
                  ? new Date(ticket.saleEndsAt)
                  : null;
                const status = getTicketStatus(ticket);

                return (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border border-border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-medium text-navy">
                          {ticket.name}
                        </p>
                        <p className="mt-1 text-sm text-navy/70">
                          {formatMoney(ticket.priceAmount, ticket.currency)}
                        </p>
                      </div>
                      <div className="text-right text-sm text-navy/70">
                        {status ? (
                          <span
                            className={
                              status === "Sold out"
                                ? "text-red-600"
                                : "text-teal"
                            }
                          >
                            {status}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-navy/70">
                      <span>
                        {saleStartsAt && saleStartsAt > now
                          ? `On sale from ${formatHarareDateTime(saleStartsAt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}`
                          : saleEndsAt && saleEndsAt < now
                            ? "Sales ended"
                            : null}
                      </span>
                      {availability > 0 && availability <= 10 ? (
                        <span className="font-medium text-teal">
                          Only {availability} left
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-[#f8fafc] p-4">
            <TicketSelector
              tickets={ticketTypes.map((ticket) => ({
                id: ticket.id,
                name: ticket.name,
                priceAmount: ticket.priceAmount,
                currency: ticket.currency,
                quantityTotal: ticket.quantityTotal,
                quantitySold: ticket.quantitySold,
                quantityReserved: ticket.quantityReserved,
                saleStartsAt: ticket.saleStartsAt,
                saleEndsAt: ticket.saleEndsAt,
                maxPerOrder: ticket.maxPerOrder,
              }))}
            />
          </div>
        </div>
      </article>
    </main>
  );
}
