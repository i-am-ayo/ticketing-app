import Link from "next/link";
import { SITE_NAME, t } from "@/lib/site";

const contactEmail = process.env.CONTACT_EMAIL ?? "hello@ticketzw.com";

export const metadata = {
  title: `Organizers | ${SITE_NAME}`,
  description: `Organizer accounts are opening soon on ${SITE_NAME}.`,
};

export default function OrganizersPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border bg-white p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-teal">
          {t("Organizers")}
        </p>
        <h1 className="mt-3 text-3xl font-medium text-navy">
          {t("Organizer accounts are opening soon.")}
        </h1>
        <p className="mt-3 text-sm text-navy/70">
          {t("Email us to register interest and we will be in touch.")}
        </p>
        <a
          href={`mailto:${contactEmail}`}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          {contactEmail}
        </a>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-navy"
          >
            {t("Back home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
