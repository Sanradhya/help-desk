import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Help Desk
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/support" className="transition-colors hover:text-ink">
            Support
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-ink">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
