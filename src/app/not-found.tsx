import Link from "next/link";
import { SITE_NAME, t } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-teal">
          {t("Page not found")}
        </p>
        <h1 className="mt-3 text-3xl font-medium text-navy">
          {t("We could not find that page")}
        </h1>
        <p className="mt-3 text-sm text-navy/70">
          {t(
            "The event or page you are looking for is not available right now.",
          )}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          {t(`Back to ${SITE_NAME}`)}
        </Link>
      </div>
    </main>
  );
}
