// Owner identity check for the write/read APIs.
//
// IMPORTANT: Cloudflare Access at the edge is the REAL security boundary — it
// stops unauthenticated requests before they ever reach this Worker. What
// follows is defense-in-depth on top of that (so a loosened Access policy
// still can't let someone else write).
//
// Why not the header: Access injects `Cf-Access-Authenticated-User-Email` when
// it proxies to a conventional origin server, but that header is NOT reliably
// forwarded to a Worker. Inside a Worker the identity lives in the Access JWT —
// the `CF_Authorization` cookie (or the `Cf-Access-Jwt-Assertion` header). We
// read the email claim from there, falling back to the header when present.
//
// The JWT signature is not verified here, so this check only holds as long as
// every hostname that can reach this Worker sits behind Access — including the
// free `*.workers.dev` route. Disable or protect that route.

function decodeJwtEmail(jwt) {
  try {
    const part = jwt.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload?.email ? String(payload.email).trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export function accessEmail(request) {
  const header = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (header) return header.trim().toLowerCase();

  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (assertion) return decodeJwtEmail(assertion);

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? decodeJwtEmail(match[1]) : null;
}

export function requireOwner(request, env) {
  // Local dev has no Access in front of it, so there is no identity to read.
  // Skip the check there; production hostnames still enforce it.
  const host = new URL(request.url).hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;

  const owner = (env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!owner) return true; // not configured — rely on Access alone
  return accessEmail(request) === owner;
}
