export const SITE_NAME = "TicketZw";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const t = (value: string) => value;

export function formatMoney(cents: number, currency: "USD" | "ZIG") {
  const value = cents / 100;

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return `ZiG ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatHarareDateTime(
  value: Date,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Harare",
    ...options,
  }).format(value);
}
