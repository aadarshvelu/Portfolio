// POST — owner uploads the PDF they just printed locally (see the "print-then-
// upload" flow on the editor page): the browser's own print-to-PDF produces
// the file, this endpoint just stores its bytes in R2 so the public /download
// route can serve them. Same Access-protection assumptions as /api/resume.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

const R2_KEY = "resume.pdf";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB — a one-page text resume is <1MB

function requireOwner(request, env) {
  const owner = (env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!owner) return true;
  const authedEmail = (request.headers.get("Cf-Access-Authenticated-User-Email") || "")
    .trim()
    .toLowerCase();
  return authedEmail === owner;
}

export async function POST(request) {
  const { env } = getCloudflareContext();
  if (!requireOwner(request, env)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "missing file" }, { status: 400 });
  }
  if (file.type && file.type !== "application/pdf") {
    return Response.json({ error: "expected a PDF file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "file too large" }, { status: 413 });
  }

  await env.RESUME_PDF.put(R2_KEY, await file.arrayBuffer(), {
    httpMetadata: { contentType: "application/pdf" },
  });

  return Response.json({ ok: true, uploadedAt: new Date().toISOString() });
}
