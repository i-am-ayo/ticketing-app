import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_OPTIONS, getPublicEventList } from "@/lib/events";
import { SITE_NAME, formatHarareDateTime, formatMoney, t } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Events | ${SITE_NAME}`,
  description: "Browse live events and tickets in Zimbabwe.",
};

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    CONCERT: "Concert",
    PARTY: "Party",
    COMEDY: "Comedy",
    CONFERENCE: "Conference",
    SPORT: "Sport",
  };

  return map[category] ?? category;
}

function getPriceLabel(
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const events = await getPublicEventList(params);
  const category = params.category ?? "ALL";
  const searchValue =
    typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <section className="rounded-3xl border border-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-teal">
              {t("Events")}
            </p>
            <h1 className="mt-2 text-3xl font-medium text-navy">
              {t("Browse upcoming events")}
            </h1>
          </div>

          <form method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={searchValue}
              maxLength={80}
              placeholder={t("Search events")}
              className="min-h-11 flex-1 rounded-full border border-border bg-white px-4 text-sm text-navy placeholder:text-navy/50 focus:border-teal"
            />
            <button
              type="submit"
              className="min-h-11 rounded-full bg-navy px-4 text-sm font-medium text-white transition-colors hover:bg-navy/90"
            >
              {t("Search")}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const isActive =
                option.value === "ALL"
                  ? category === "ALL" || !category
                  : category === option.value;
              const href = new URLSearchParams();

              if (searchValue) {
                href.set("q", searchValue);
              }

              if (option.value !== "ALL") {
                href.set("category", option.value);
              }

              const link = href.toString() ? `?${href.toString()}` : "/events";

              return (
                <Link
                  key={option.value}
                  href={link}
                  className={[
                    "min-h-11 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-navy bg-navy text-white"
                      : "border-border bg-white text-navy hover:border-navy/50",
                  ].join(" ")}
                >
                  {t(option.label)}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6">
        {events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-lg font-medium text-navy">
              {t("No events match your search")}
            </p>
            <p className="mt-2 text-sm text-navy/70">
              {t(
                "Try a different keyword or category to find upcoming events.",
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => {
              const start = formatHarareDateTime(event.startsAt, {
                dateStyle: "medium",
                timeStyle: "short",
              });
              const end = formatHarareDateTime(event.endsAt, {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group overflow-hidden rounded-3xl border border-border bg-white transition-colors hover:border-navy/40"
                >
                  <div className="flex h-30 items-center justify-center bg-navy-tint px-4 text-center text-sm font-medium uppercase tracking-[0.12em] text-navy">
                    {getCategoryLabel(event.category)}
                  </div>

                  <div className="space-y-3 p-4">
                    <span className="inline-flex rounded-full bg-teal-tint px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-teal">
                      {getCategoryLabel(event.category)}
                    </span>
                    <h2 className="text-xl font-medium text-navy group-hover:text-teal">
                      {event.title}
                    </h2>
                    <div className="space-y-1 text-sm text-navy/70">
                      <p>{start}</p>
                      <p>{end}</p>
                      <p>
                        {event.venue} · {event.city}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <p className="text-sm text-navy/70">{t("From")}</p>
                      <p className="text-base font-medium text-teal">
                        {getPriceLabel(event.ticketTypes)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
