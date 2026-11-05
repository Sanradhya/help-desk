import { ticketActor } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import {
  parseStatusInput,
  serializeTicket,
  statusForbiddenForActor,
  ticketWhere,
  type TicketActor,
  type TicketStatus,
} from "@/lib/tickets";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function buildTicketUpdate(
  actor: TicketActor,
  parsed: {
    status: TicketStatus;
    resolutionSummary?: string | null;
    resolutionNote?: string | null;
  },
) {
  const data: {
    status: TicketStatus;
    resolutionSummary?: string | null;
    resolutionNote?: string | null;
    resolvedAt?: Date;
  } = { status: parsed.status };

  if (actor === "agent") {
    if (parsed.resolutionSummary !== undefined) {
      data.resolutionSummary = parsed.resolutionSummary;
    }
    return data;
  }

  if (parsed.status === "RESOLVED") {
    data.resolvedAt = new Date();
    if (parsed.resolutionNote !== undefined) {
      data.resolutionNote = parsed.resolutionNote;
    }
  }

  return data;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await ticketActor(request);
  if (!actor) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const where = ticketWhere(id);
  if (!where) {
    return Response.json({ error: "Ticket not found." }, { status: 404 });
  }

  const parsed = parseStatusInput(await readJson(request));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const forbidden = statusForbiddenForActor(actor, parsed.status);
  if (forbidden) {
    return Response.json({ error: forbidden }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.ticket.findUnique({ where });
    if (!existing) {
      return Response.json({ error: "Ticket not found." }, { status: 404 });
    }

    const ticket = await prisma.ticket.update({
      where: { id: existing.id },
      data: buildTicketUpdate(actor, parsed),
    });

    return Response.json({ ticket: serializeTicket(ticket) });
  } catch (error) {
    console.error("Failed to update ticket", error);
    return Response.json({ error: "Could not update the ticket." }, { status: 500 });
  }
}
