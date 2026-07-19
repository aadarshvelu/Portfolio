// GET loads the saved resume JSON from KV, POST saves it.
//
// This whole app is expected to sit behind Cloudflare Access (see project
// README for the exact dashboard steps) — unauthenticated requests never even
// reach this handler, they're stopped at Cloudflare's edge. The requireOwner
// check below is defense-in-depth on top of that, not the primary gate.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

const KV_KEY = "resume";
const MAX_BODY_BYTES = 200_000; // generous; a resume JSON is a few KB

function requireOwner(request, env) {
  const owner = (env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!owner) return true; // not configured yet — skip the extra check
  const authedEmail = (request.headers.get("Cf-Access-Authenticated-User-Email") || "")
    .trim()
    .toLowerCase();
  return authedEmail === owner;
}

export async function GET(request) {
  const { env } = getCloudflareContext();
  if (!requireOwner(request, env)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const raw = await env.RESUME_KV.get(KV_KEY);
  if (!raw) {
    return Response.json(null, { status: 404 });
  }
  return new Response(raw, {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function POST(request) {
  const { env } = getCloudflareContext();
  if (!requireOwner(request, env)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return Response.json({ error: "payload too large" }, { status: 413 });
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  // Minimal shape check — enough to reject garbage without hardcoding the
  // full resume schema here (that lives in app/resumeData.js).
  if (!parsed || typeof parsed !== "object" || typeof parsed.name !== "string") {
    return Response.json({ error: "unexpected shape" }, { status: 400 });
  }

  await env.RESUME_KV.put(KV_KEY, JSON.stringify(parsed));
  return Response.json({ ok: true, savedAt: new Date().toISOString() });
}
