import { getCloudflareContext } from "@opennextjs/cloudflare";
import defaultData from "./resumeData.js";

// Server-side read of the saved resume JSON straight from KV — no HTTP round
// trip, no auth needed, because this runs *inside* the Worker with the binding
// in hand. Used by the PUBLIC "/" page, so it must not require the owner. Falls
// back to the committed default if nothing has been saved yet.
export async function loadResume() {
  try {
    const { env } = getCloudflareContext();
    const raw = await env.RESUME_KV.get("resume");
    if (raw) return { ...structuredClone(defaultData), ...JSON.parse(raw) };
  } catch {
    /* KV unavailable (e.g. local build) — fall back to default */
  }
  return structuredClone(defaultData);
}
