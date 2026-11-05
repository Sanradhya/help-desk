"use client";

export default function DashboardError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Tickets are unavailable</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        The board could not read PostgreSQL. Confirm DATABASE_URL, start the
        database, and run the Prisma migration.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-ink px-4 py-2 text-sm text-paper"
      >
        Try again
      </button>
    </main>
  );
}
