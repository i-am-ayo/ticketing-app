import Link from "next/link";
import { SITE_NAME, t } from "@/lib/site";

const contactEmail = process.env.CONTACT_EMAIL ?? "hello@ticketzw.com";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium text-navy">{SITE_NAME}</p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-4 text-sm text-navy/75"
          >
            <Link href="/events">{t("Events")}</Link>
            <Link href="#faq">{t("FAQs")}</Link>
            <Link href="/terms">{t("Terms")}</Link>
            <Link href="/privacy">{t("Privacy")}</Link>
            <a href={`mailto:${contactEmail}`}>{t("Contact")}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
