import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { hasAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { serializeTicket } from "@/lib/tickets";
import { LoginForm } from "./login-form";
import { TicketBoard } from "./ticket-board";

export const metadata: Metadata = {
  title: "Ticket dashboard",
  description: "Open and resolved bug tickets.",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-copper">
        Developer board
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Tickets</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Open and resolved counts stay in sync with the columns. Move a card when
        the bug is fixed, or refresh to pull in new reports.
      </p>
      <div className="mt-8">
        <Suspense fallback={<BoardFallback />}>
          <TicketBoardLoader />
        </Suspense>
      </div>
    </main>
  );
}

async function TicketBoardLoader() {
  await connection();
  if (!(await hasAdminSession())) {
    return <LoginForm />;
  }

  const tickets = await getPrisma().ticket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <TicketBoard initialTickets={tickets.map(serializeTicket)} />;
}

function BoardFallback() {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
      {["Open", "Resolved", "All tickets"].map((label) => (
        <div key={label} className="h-24 animate-pulse rounded-2xl border border-line bg-card" />
      ))}
    </div>
  );
}
