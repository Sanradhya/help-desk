import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-copper">
        Ticketing
      </p>
      <h1 className="mt-3 max-w-xl text-5xl font-semibold tracking-tight">
        Bugs come in public. Fixes stay on the board.
      </h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-muted">
        Anyone can file a report for Site 1, Site 2, or Site 3. Developers see
        every open and resolved ticket in one place.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/support"
          className="rounded-2xl border border-line bg-card p-6 transition hover:border-copper"
        >
          <p className="text-sm font-medium text-muted">Public</p>
          <p className="mt-2 text-xl font-semibold">Report a bug</p>
        </Link>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-line bg-ink p-6 text-paper transition hover:bg-copper"
        >
          <p className="text-sm text-paper/70">Developers</p>
          <p className="mt-2 text-xl font-semibold">Open the board</p>
        </Link>
      </div>
    </main>
  );
}
