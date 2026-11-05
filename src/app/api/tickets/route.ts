import { agentOrAdminAuthorized } from "@/lib/admin-auth";
import { notifyDiscord } from "@/lib/discord";
import { getPrisma } from "@/lib/prisma";
import { allowTicketCreate, clientAddress } from "@/lib/rate-limit";
import { formatTicketNumber, parseTicketInput, serializeTicket } from "@/lib/tickets";

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!(await agentOrAdminAuthorized(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const tickets = await getPrisma().ticket.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ tickets: tickets.map(serializeTicket) });
  } catch (error) {
    console.error("Failed to list tickets", error);
    return Response.json({ error: "Could not load tickets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!allowTicketCreate(clientAddress(request))) {
    return Response.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const parsed = parseTicketInput(await readJson(request));
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const ticket = await getPrisma().ticket.create({
      data: {
        project: parsed.project,
        description: parsed.description,
      },
    });

    const webhook = await notifyDiscord({
      id: formatTicketNumber(ticket.number),
      project: ticket.project,
      description: ticket.description,
    });

    return Response.json(
      {
        ticket: serializeTicket(ticket),
        webhookDelivered: webhook.ok,
        ...(webhook.ok ? {} : { webhookError: webhook.error }),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create ticket", error);
    return Response.json(
      { error: "Could not save the ticket. Check the database connection." },
      { status: 500 },
    );
  }
}
