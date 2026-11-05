import type { Metadata } from "next";
import { SupportForm } from "./support-form";

export const metadata: Metadata = {
  title: "Report a bug",
  description: "Submit a bug report for Site 1, Site 2, or Site 3.",
};

export default function SupportPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:py-16">
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-copper">
          Public intake
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Report a bug</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Pick the project and describe what went wrong. The ticket is stored
          immediately, then a Discord channel is notified with the ticket id,
          project name, and description.
        </p>
      </section>
      <SupportForm />
    </main>
  );
}
