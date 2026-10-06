import Link from "next/link";
import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/events";
import { SITE_NAME, formatHarareDateTime, formatMoney, t } from "@/lib/site";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Tickets for live events across Zimbabwe.",
};

function getCheapestPrice(
  ticketTypes: Array<{
    priceAmount: number;
    currency: "USD" | "ZIG";
    saleEndsAt: Date | null;
    saleStartsAt: Date | null;
  }>,
) {
  const now = new Date();
  const onSale = ticketTypes.filter((ticket) => {
    const startsAtOk = !ticket.saleStartsAt || ticket.saleStartsAt <= now;
    const endsAtOk = !ticket.saleEndsAt || ticket.saleEndsAt > now;
    return startsAtOk && endsAtOk;
  });

  if (!onSale.length) {
    return t("Tickets coming soon");
  }

  const cheapest = onSale.reduce((current, ticket) =>
    ticket.priceAmount < current.priceAmount ? ticket : current,
  );

  return `${t("From")} ${formatMoney(cheapest.priceAmount, cheapest.currency)}`;
}

export default async function HomePage() {
  const upcomingEvents = await getUpcomingEvents(3);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <section className="rounded-[2rem] border border-border bg-white p-5 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal">
              {t("Ticketing made simple")}
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-medium leading-tight text-navy sm:text-5xl">
              {t("Sell tickets to your event, online")}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-navy/75">
              {t(
                "Create your event, share one link, and check guests in at the door with a QR code on any phone.",
              )}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/organizers"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
              >
                {t("Start selling")}
              </Link>
              <Link
                href="/events"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-navy transition-colors hover:border-navy/50"
              >
                {t("Browse events")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "QR check-in", tone: "bg-navy-tint text-navy" },
              { label: "Ticket tiers", tone: "bg-teal-tint text-teal" },
              { label: "Live sales", tone: "bg-[#edf7f5] text-teal" },
              { label: "Attendee list", tone: "bg-[#f1f6fb] text-navy" },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`flex min-h-24 flex-col justify-between rounded-2xl border border-border p-4 ${tile.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className="h-2.5 w-2.5 rounded-full bg-current opacity-80" />
                  <span className="h-6 w-6 rounded-md border border-current/60" />
                </div>
                <span className="text-sm font-medium">{t(tile.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-medium text-navy">
            {t("Upcoming events")}
          </h2>
          <Link
            href="/events"
            className="text-sm font-medium text-teal hover:text-teal/80"
          >
            {t("See all")}
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center text-sm text-navy/70">
            {t("No upcoming events right now. Check back soon.")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.map((event) => {
              const start = formatHarareDateTime(event.startsAt, {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block overflow-hidden rounded-3xl border border-border bg-white transition-colors hover:border-navy/50"
                >
                  <div className="flex h-24 items-center justify-center bg-navy-tint text-center text-xs font-medium uppercase tracking-[0.14em] text-navy">
                    {event.category}
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-teal">
                      {event.category}
                    </p>
                    <h3 className="text-lg font-medium text-navy">
                      {event.title}
                    </h3>
                    <p className="text-sm text-navy/70">{start}</p>
                    <p className="text-sm text-navy/70">{event.city}</p>
                    <p className="text-sm font-medium text-teal">
                      {getCheapestPrice(event.ticketTypes)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section id="how-it-works" className="mt-12">
        <h2 className="text-2xl font-medium text-navy">{t("How it works")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Create your event",
              text: "Add details, ticket types and prices, then publish.",
            },
            {
              title: "Share your link",
              text: "Send one link on WhatsApp, Instagram or anywhere.",
            },
            {
              title: "Scan at the door",
              text: "Check guests in with a phone camera.",
            },
          ].map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-border bg-white p-5"
            >
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-tint text-sm font-medium text-teal">
                {index + 1}
              </div>
              <h3 className="text-lg font-medium text-navy">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-navy/70">
                {t(step.text)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-medium text-navy">
          {t("Built for organizers")}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[
            "QR check-in",
            "Ticket tiers",
            "Live sales",
            "Attendee lists",
            "One event link",
            "Works on any phone",
          ].map((tile) => (
            <div
              key={tile}
              className="rounded-3xl border border-border bg-white p-5"
            >
              <div className="mb-3 h-10 w-10 rounded-2xl border border-border bg-navy-tint" />
              <p className="text-base font-medium text-navy">{t(tile)}</p>
              <p className="mt-2 text-sm text-navy/70">
                {t(
                  tile === "QR check-in"
                    ? "Check guests in without a ticket booth."
                    : tile === "Ticket tiers"
                      ? "Create price levels in minutes."
                      : tile === "Live sales"
                        ? "Track ticket movement as it happens."
                        : tile === "Attendee lists"
                          ? "Keep guest details in one place."
                          : tile === "One event link"
                            ? "Share one link instead of many messages."
                            : "Your audience can use their phone.",
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-border bg-[#eaf6f4] p-6 text-center">
        <h2 className="text-2xl font-medium text-navy">
          {t("Ready to sell your first ticket?")}
        </h2>
        <Link
          href="/organizers"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          {t("Create an event")}
        </Link>
      </section>

      <section id="faq" className="mt-12 space-y-4">
        <h2 className="text-2xl font-medium text-navy">{t("FAQs")}</h2>
        <div className="space-y-3 rounded-3xl border border-border bg-white p-4">
          <div>
            <p className="font-medium text-navy">
              {t("Do buyers need an account?")}
            </p>
            <p className="mt-1 text-sm text-navy/70">
              {t("No, buyers only need a phone number.")}
            </p>
          </div>
          <div>
            <p className="font-medium text-navy">
              {t("Can I share one event link?")}
            </p>
            <p className="mt-1 text-sm text-navy/70">
              {t("Yes, one link is enough to share an event.")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
