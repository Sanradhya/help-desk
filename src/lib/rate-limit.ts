const WINDOW_MS = 60_000;
const MAX_POSTS = 5;

type Bucket = { timestamps: number[] };

const globalStore = globalThis as unknown as { hdTicketPosts?: Map<string, Bucket> };

function buckets() {
  if (!globalStore.hdTicketPosts) {
    globalStore.hdTicketPosts = new Map();
  }
  return globalStore.hdTicketPosts;
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  return real || "unknown";
}

export function allowTicketCreate(ip: string) {
  const now = Date.now();
  const map = buckets();
  const bucket = map.get(ip) ?? { timestamps: [] };
  const recent = bucket.timestamps.filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_POSTS) {
    bucket.timestamps = recent;
    map.set(ip, bucket);
    return false;
  }
  recent.push(now);
  bucket.timestamps = recent;
  map.set(ip, bucket);
  return true;
}
