import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const STATUSES = ["OPEN", "TRIAGED", "IN_PROGRESS", "READY_FOR_REVIEW", "RESOLVED"];
const MAX_SUMMARY_LENGTH = 4000;

function fail(message) {
  console.log(message);
  process.exit(1);
}

function readEnvFile(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    return {};
  }
  const values = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const args = process.argv.slice(2);
const positional = [];
let summaryFile;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--summary-file") {
    summaryFile = args[index + 1];
    if (!summaryFile) fail("error: --summary-file needs a path.");
    index += 1;
    continue;
  }
  positional.push(arg);
}

const [ticketRef, status] = positional;
if (!ticketRef || !status || positional.length !== 2) {
  fail("error: usage: npm run ticket -- <HD-number or id> <STATUS> [--summary-file <path>]");
}
if (!STATUSES.includes(status)) {
  fail(`error: STATUS must be one of ${STATUSES.join(", ")}.`);
}

let resolutionSummary;
if (summaryFile !== undefined) {
  let summary;
  try {
    summary = readFileSync(resolve(summaryFile), "utf8");
  } catch {
    fail("error: could not read the summary file.");
  }
  if (summary.length > MAX_SUMMARY_LENGTH) {
    fail(`error: summary must be ${MAX_SUMMARY_LENGTH} characters or fewer.`);
  }
  resolutionSummary = summary;
}

const fileEnv = readEnvFile(resolve(process.cwd(), ".env.local"));
const base = (fileEnv.HELPDESK_URL || process.env.HELPDESK_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const apiKey = fileEnv.AGENT_API_KEY || process.env.AGENT_API_KEY || "";
if (!apiKey) fail("error: AGENT_API_KEY is not set.");

const payload = { status };
if (resolutionSummary !== undefined) payload.resolutionSummary = resolutionSummary;

let response;
try {
  response = await fetch(`${base}/api/tickets/${encodeURIComponent(ticketRef)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
} catch (error) {
  const message = error instanceof Error ? error.message : "request failed";
  fail(`error: ${message}`);
}

let body = {};
try {
  body = await response.json();
} catch {
  body = {};
}

if (!response.ok) {
  const message = typeof body.error === "string" ? body.error : `HTTP ${response.status}`;
  fail(`error: ${message}`);
}

const ticket = body.ticket ?? {};
const label = typeof ticket.number === "number" ? `HD-${ticket.number}` : ticketRef;
console.log(`${label} ${ticket.status ?? status}`);
