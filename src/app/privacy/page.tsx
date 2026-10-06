import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy | ${SITE_NAME}`,
  description: `Privacy policy for ${SITE_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border bg-white p-6">
        <h1 className="text-3xl font-medium text-navy">Privacy policy</h1>
        <p className="mt-5 text-sm leading-7 text-navy/75">
          This page is being prepared.
        </p>
      </div>
    </main>
  );
}
