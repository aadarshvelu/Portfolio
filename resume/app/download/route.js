// PUBLIC route — serves the latest uploaded resume PDF from R2.
//
// ⚠️ THIS ROUTE MUST NOT BE BEHIND CLOUDFLARE ACCESS. Everything else in this
// app (the editor at "/", and /api/*) should require the owner's login — but
// portfolio visitors need to download the resume without hitting a login
// wall. When setting up the Access application in the Cloudflare dashboard,
// scope it to the app MINUS this path (or add a second "Bypass" policy for
// exactly this path) — see the project README for the exact steps.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

const R2_KEY = "resume.pdf";

export async function GET() {
  const { env } = getCloudflareContext();
  const object = await env.RESUME_PDF.get(R2_KEY);
  if (!object) {
    return new Response("No resume has been uploaded yet.", { status: 404 });
  }

  // Best-effort nicer filename from the saved data; falls back if unavailable.
  let filename = "Resume.pdf";
  try {
    const raw = await env.RESUME_KV.get("resume");
    const name = raw && JSON.parse(raw)?.name;
    if (name) filename = `${name.replace(/[^a-z0-9]+/gi, "-")}-Resume.pdf`;
  } catch {
    /* ignore — filename fallback above is fine */
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=300",
    },
  });
}
