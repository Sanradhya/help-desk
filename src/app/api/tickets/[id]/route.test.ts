import { beforeEach, expect, jest, test } from "@jest/globals";
import { createAdminSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { PATCH } from "./route";

const cookieJar: { token?: string } = {};

jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookieJar.token ? { value: cookieJar.token } : undefined),
  }),
}));

jest.mock("@/lib/prisma", () => ({
  getPrisma: jest.fn(),
}));

const prisma = jest.mocked(getPrisma);

const savedTicket = {
  id: "ticket-1",
  number: 4,
  project: "Site 1",
  description: "Checkout total is wrong.",
  status: "READY_FOR_REVIEW" as const,
  resolutionSummary: "Fixed the total.",
  resolutionNote: null,
  resolvedAt: null,
  createdAt: new Date("2026-11-03T00:00:00.000Z"),
};

function request(body: unknown, authorization?: string) {
  return new Request("http://localhost/api/tickets/HD-4", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ id: "HD-4" }) };

beforeEach(() => {
  cookieJar.token = undefined;
  process.env.AGENT_API_KEY = "agent-key";
  process.env.ADMIN_PASSWORD = "developer-password";
  prisma.mockReset();
});

test("agent API key receives 403 when setting RESOLVED", async () => {
  const response = await PATCH(
    request({ status: "RESOLVED", resolutionSummary: "Shipped the fix." }, "Bearer agent-key"),
    context,
  );
  const payload = (await response.json()) as { error?: string };

  expect(response.status).toBe(403);
  expect(payload.error).toBe("Only a logged-in developer can resolve a ticket.");
  expect(prisma).not.toHaveBeenCalled();
});

test("agent API key still receives 403 for RESOLVED when an admin cookie is also present", async () => {
  cookieJar.token = createAdminSession("developer-password") ?? undefined;

  const response = await PATCH(
    request({ status: "RESOLVED" }, "Bearer agent-key"),
    context,
  );

  expect(response.status).toBe(403);
  expect(prisma).not.toHaveBeenCalled();
});

test("agent API key can set READY_FOR_REVIEW and a resolution summary", async () => {
  const update = jest.fn(async () => savedTicket);
  prisma.mockReturnValue({
    ticket: {
      findUnique: async () => ({ id: "ticket-1" }),
      update,
    },
  } as never);

  const response = await PATCH(
    request(
      { status: "READY_FOR_REVIEW", resolutionSummary: "Fixed the total." },
      "Bearer agent-key",
    ),
    context,
  );

  expect(response.status).toBe(200);
  expect(update).toHaveBeenCalledWith({
    where: { id: "ticket-1" },
    data: { status: "READY_FOR_REVIEW", resolutionSummary: "Fixed the total." },
  });
});

test("logged-in admin can set RESOLVED with a developer note without touching the agent summary", async () => {
  cookieJar.token = createAdminSession("developer-password") ?? undefined;
  const update = jest.fn(async () => ({
    ...savedTicket,
    status: "RESOLVED" as const,
    resolutionNote: "Verified in prod.",
    resolvedAt: new Date("2026-11-04T12:00:00.000Z"),
  }));
  prisma.mockReturnValue({
    ticket: {
      findUnique: async () => ({ id: "ticket-1" }),
      update,
    },
  } as never);

  const response = await PATCH(
    request({
      status: "RESOLVED",
      resolutionNote: "Verified in prod.",
      resolutionSummary: "Should be ignored.",
    }),
    context,
  );

  expect(response.status).toBe(200);
  expect(update).toHaveBeenCalledWith({
    where: { id: "ticket-1" },
    data: {
      status: "RESOLVED",
      resolutionNote: "Verified in prod.",
      resolvedAt: expect.any(Date),
    },
  });
});

test("logged-in admin can resolve with an empty developer note", async () => {
  cookieJar.token = createAdminSession("developer-password") ?? undefined;
  const update = jest.fn(async () => ({
    ...savedTicket,
    status: "RESOLVED" as const,
    resolutionNote: null,
    resolvedAt: new Date("2026-11-04T12:00:00.000Z"),
  }));
  prisma.mockReturnValue({
    ticket: {
      findUnique: async () => ({ id: "ticket-1" }),
      update,
    },
  } as never);

  const response = await PATCH(
    request({ status: "RESOLVED", resolutionNote: null }),
    context,
  );

  expect(response.status).toBe(200);
  expect(update).toHaveBeenCalledWith({
    where: { id: "ticket-1" },
    data: {
      status: "RESOLVED",
      resolutionNote: null,
      resolvedAt: expect.any(Date),
    },
  });
});

test("logged-in admin reopen only changes status", async () => {
  cookieJar.token = createAdminSession("developer-password") ?? undefined;
  const update = jest.fn(async () => ({
    ...savedTicket,
    status: "OPEN" as const,
  }));
  prisma.mockReturnValue({
    ticket: {
      findUnique: async () => ({ id: "ticket-1" }),
      update,
    },
  } as never);

  const response = await PATCH(
    request({
      status: "OPEN",
      resolutionSummary: null,
      resolutionNote: null,
    }),
    context,
  );

  expect(response.status).toBe(200);
  expect(update).toHaveBeenCalledWith({
    where: { id: "ticket-1" },
    data: { status: "OPEN" },
  });
});
