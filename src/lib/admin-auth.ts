import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "hd_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function constantTimeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function sessionSecret() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${signSessionPayload(payload)}`;
}

function verifySessionToken(token: string) {
  const secret = sessionSecret();
  if (!secret) return false;

  const dot = token.indexOf(".");
  if (dot === -1) return false;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = signSessionPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function createAdminSession(password: string) {
  const expected = sessionSecret();
  if (!expected) return null;
  if (!constantTimeEqual(password, expected)) return null;
  return createSessionToken();
}

export async function hasAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export function bearerAuthorized(request: Request) {
  const expected = process.env.AGENT_API_KEY ?? "";
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  return constantTimeEqual(presented, expected);
}

export async function agentOrAdminAuthorized(request: Request) {
  return (await ticketActor(request)) !== null;
}

export async function ticketActor(request: Request): Promise<"agent" | "admin" | null> {
  if (bearerAuthorized(request)) return "agent";
  if (await hasAdminSession()) return "admin";
  return null;
}

export { SESSION_TTL_MS };
