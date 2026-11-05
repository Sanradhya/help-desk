const DISCORD_DESCRIPTION_LIMIT = 1500;
const DISCORD_CONTENT_LIMIT = 2000;

type TicketNotice = {
  id: string;
  project: string;
  description: string;
};

type AllowedMentions = {
  roles: string[];
  users?: string[];
};

export async function notifyDiscord(
  ticket: TicketNotice,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { ok: false, error: "DISCORD_WEBHOOK_URL is not set." };
  }

  const roleId = readSnowflake(process.env.DISCORD_BOT_ROLE_ID);
  const entryAgent = process.env.DISCORD_ENTRY_AGENT?.trim() || "lead";
  const ownerId = projectOwnerId(ticket.project);
  const description = sanitizeDescription(ticket.description);
  const assigned = ownerId ? `Assigned: <@${ownerId}>` : "";
  const head = [roleId ? `<@&${roleId}>-${entryAgent}` : "", ticket.id, ticket.project]
    .filter((line) => line.length > 0)
    .join("\n");
  const tail = assigned ? `\n${assigned}` : "";
  const room = DISCORD_CONTENT_LIMIT - head.length - 1 - tail.length;
  const body = description.slice(0, Math.max(0, Math.min(DISCORD_DESCRIPTION_LIMIT, room)));
  const content = `${head}\n${body}${tail}`;

  const allowedMentions: AllowedMentions = { roles: roleId ? [roleId] : [] };
  if (ownerId) allowedMentions.users = [ownerId];

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        allowed_mentions: allowedMentions,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Discord responded with ${response.status}.`,
      };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook request failed.";
    return { ok: false, error: message };
  }
}

export function sanitizeDescription(value: string) {
  return value
    .replaceAll("@", "(at)")
    .replace(/<[^>]*>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, DISCORD_DESCRIPTION_LIMIT);
}

function projectOwnerId(project: string) {
  const raw = process.env.PROJECT_OWNERS?.trim();
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
  const value = (parsed as Record<string, unknown>)[project];
  if (typeof value !== "string") return undefined;
  return readSnowflake(value);
}

function readSnowflake(value: string | undefined) {
  const id = value?.trim() ?? "";
  return /^\d{5,25}$/.test(id) ? id : undefined;
}
