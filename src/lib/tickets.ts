export const PROJECT_NAMES = ["Site 1", "Site 2", "Site 3"] as const;
export const TICKET_STATUSES = [
  "OPEN",
  "TRIAGED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "RESOLVED",
] as const;

export type TicketActor = "agent" | "admin";

export type ProjectName = (typeof PROJECT_NAMES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type TicketView = {
  id: string;
  number: number;
  project: string;
  description: string;
  status: TicketStatus;
  resolutionSummary: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_RESOLUTION_SUMMARY_LENGTH = 4000;
const MAX_RESOLUTION_NOTE_LENGTH = 4000;

export function isProjectName(value: string): value is ProjectName {
  return (PROJECT_NAMES as readonly string[]).includes(value);
}

export function isTicketStatus(value: string): value is TicketStatus {
  return (TICKET_STATUSES as readonly string[]).includes(value);
}

export function statusForbiddenForActor(actor: TicketActor, status: TicketStatus): string | null {
  if (actor === "agent" && status === "RESOLVED") {
    return "Only a logged-in developer can resolve a ticket.";
  }
  return null;
}

export function parseTicketInput(
  body: unknown,
): { ok: true; project: ProjectName; description: string } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be JSON." };
  }

  const record = body as { project?: unknown; description?: unknown };

  if (typeof record.project !== "string" || !isProjectName(record.project)) {
    return { ok: false, error: "Choose Site 1, Site 2, or Site 3." };
  }

  if (typeof record.description !== "string") {
    return { ok: false, error: "Describe the bug." };
  }

  const description = record.description.trim();
  if (!description) {
    return { ok: false, error: "Describe the bug." };
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, project: record.project, description };
}

function parseOptionalTextField(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): { ok: true; value: string | null } | { ok: false; error: string } | { ok: true; value: undefined } {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldLabel} must be a string.` };
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${fieldLabel} must be ${maxLength} characters or fewer.`,
    };
  }
  return { ok: true, value: trimmed || null };
}

export function parseStatusInput(
  body: unknown,
):
  | {
      ok: true;
      status: TicketStatus;
      resolutionSummary?: string | null;
      resolutionNote?: string | null;
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be JSON." };
  }

  const record = body as {
    status?: unknown;
    resolutionSummary?: unknown;
    resolutionNote?: unknown;
  };

  if (typeof record.status !== "string" || !isTicketStatus(record.status)) {
    return {
      ok: false,
      error: `Status must be one of: ${TICKET_STATUSES.join(", ")}.`,
    };
  }

  const summaryResult = parseOptionalTextField(
    record.resolutionSummary,
    "Resolution summary",
    MAX_RESOLUTION_SUMMARY_LENGTH,
  );
  if (!summaryResult.ok) {
    return summaryResult;
  }

  const noteResult = parseOptionalTextField(
    record.resolutionNote,
    "Resolution note",
    MAX_RESOLUTION_NOTE_LENGTH,
  );
  if (!noteResult.ok) {
    return noteResult;
  }

  return {
    ok: true,
    status: record.status,
    ...(summaryResult.value !== undefined ? { resolutionSummary: summaryResult.value } : {}),
    ...(noteResult.value !== undefined ? { resolutionNote: noteResult.value } : {}),
  };
}

export function formatTicketNumber(number: number) {
  return `HD-${number}`;
}

export function ticketWhere(param: string): { id: string } | { number: number } | null {
  if (param.startsWith("HD-")) {
    const digits = param.slice(3);
    if (!/^[1-9]\d{0,9}$/.test(digits)) return null;
    const number = Number(digits);
    if (number > 2_147_483_647) return null;
    return { number };
  }
  if (!param) return null;
  return { id: param };
}

export function serializeTicket(ticket: {
  id: string;
  number: number;
  project: string;
  description: string;
  status: TicketStatus;
  resolutionSummary: string | null;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}): TicketView {
  return {
    id: ticket.id,
    number: ticket.number,
    project: ticket.project,
    description: ticket.description,
    status: ticket.status,
    resolutionSummary: ticket.resolutionSummary,
    resolutionNote: ticket.resolutionNote,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
  };
}

export { MAX_DESCRIPTION_LENGTH };
