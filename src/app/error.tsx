"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-teal">
          Error
        </p>
        <h1 className="mt-3 text-3xl font-medium text-navy">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-navy/70">
          We could not load this page. Please try again in a moment.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
        >
          Back to TicketZw
        </Link>
      </div>
    </main>
  );
}
