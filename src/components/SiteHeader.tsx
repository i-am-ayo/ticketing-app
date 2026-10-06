import Link from "next/link";
import { SITE_NAME, t } from "@/lib/site";

export function SiteHeader() {
  const navItems = [
    { href: "/events", label: t("Events") },
    { href: "#how-it-works", label: t("How it works") },
    { href: "#faq", label: t("FAQs") },
  ];

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-medium text-navy sm:text-xl">
          {SITE_NAME}
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-navy/80 transition-colors hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/organizers"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-navy transition-colors hover:border-navy/50"
          >
            {t("Log in")}
          </Link>
          <Link
            href="/organizers"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-4 text-sm font-medium text-white transition-colors hover:bg-navy/90"
          >
            {t("Sell tickets")}
          </Link>
        </nav>

        <details className="relative md:hidden">
          <summary className="list-none rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-navy">
            {t("Menu")}
          </summary>
          <nav className="absolute right-0 top-full z-10 mt-2 w-56 rounded-2xl border border-border bg-white p-3 shadow-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-navy hover:bg-[#f8fafc]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/organizers"
              className="mt-2 flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-navy hover:bg-[#f8fafc]"
            >
              {t("Log in")}
            </Link>
            <Link
              href="/organizers"
              className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-navy px-4 text-sm font-medium text-white"
            >
              {t("Sell tickets")}
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
