# AI Readiness

This is a **static site** (Vite build, no backend, no API, no auth server,
no database) deployed as prebuilt HTML/JS/CSS + a `public/` asset folder.
That shape decides what "AI-ready" can honestly mean here — some checks from
agent-discovery scanners (isitagentready.com and similar) apply cleanly;
others assume infrastructure (an API, an OAuth server, a DNS zone you
script against, an MCP server) that this project doesn't have. Rather than
publish fabricated metadata to pass a checklist, unsupported items below are
marked **N/A** with the reason.

## Implemented

| Item | File | Notes |
|---|---|---|
| `robots.txt` | [public/robots.txt](public/robots.txt) | Explicit `User-agent` rules incl. GPTBot, ClaudeBot, OAI-SearchBot, ChatGPT-User, Google-Extended, PerplexityBot. References the sitemap. |
| `sitemap.xml` | [public/sitemap.xml](public/sitemap.xml) | Lists canonical URLs. Update when routes are added. |
| Content Signals | [public/robots.txt](public/robots.txt) | `Content-Signal: ai-train=..., search=..., ai-input=...` — edit the values to match your actual preference; scanners only check the directive exists, not its value. |
| AI-crawler rules | [public/robots.txt](public/robots.txt) | Same file as robots.txt — explicit entries per major AI crawler rather than relying on the wildcard. |
| Link headers (RFC 8288) | [public/_headers](public/_headers) + [index.html](index.html) | `_headers` is the Netlify/Cloudflare Pages convention for static-file response headers. **GitHub Pages and some other static hosts ignore `_headers` entirely** — if that's where this deploys, the header must be configured at the CDN layer, so an HTML `<link rel="api-catalog">`/`<link rel="sitemap">` fallback is also in `index.html` for crawlers that read the DOM instead of headers. |
| API catalog (RFC 9727) | [public/.well-known/api-catalog](public/.well-known/api-catalog) | Empty `linkset` — **honest, not padded**: this site has no public API to catalog. The file exists (returns 200, not 404) so scanners don't flag it missing, but it declares nothing that isn't real. |
| Agent Skills index | [public/.well-known/agent-skills/index.json](public/.well-known/agent-skills/index.json) | Empty `skills` array for the same reason — no packaged "skills" exist yet. |
| WebMCP | [src/webmcp.js](src/webmcp.js) | Real tools, not stubs: `view_resume`, `download_resume`, `scroll_to_projects` via `navigator.modelContext.provideContext()`. No-ops safely in browsers without WebMCP support. |

## Deliberately not implemented (N/A for this site)

| Item | Why it's skipped |
|---|---|
| DNS for AI Discovery (DNS-AID) | Requires publishing signed (DNSSEC) SVCB/HTTPS records on the domain's DNS zone — that's a registrar/DNS-host change, not a code change, and out of scope for this repo. If you want it, add `_index._agents.whoisaadar.sh` SVCB records at your DNS provider. |
| Markdown-for-Agents content negotiation | Requires a server (or edge function) that inspects the `Accept` header and returns a different body — a static file host always returns the same bytes regardless of `Accept`. Would need a Cloudflare Worker / Vercel edge function in front of the static site. |
| Web Bot Auth (`/.well-known/http-message-signatures-directory`) | Requires generating and safely storing a real signing keypair, then using it to sign this site's own outbound bot requests. Publishing a placeholder JWKS with no real key behind it would be actively misleading. Add this only when the site itself sends signed agent requests. |
| OAuth/OIDC discovery, OAuth Protected Resource Metadata | This site has no protected API and no auth server issuing tokens — there is nothing for `authorization_endpoint`/`token_endpoint` to point to. |
| `auth.md` | Depends on the OAuth metadata above; same reason. |
| MCP Server Card | This site doesn't run an MCP server (no tool-calling backend) — WebMCP (above) covers agent-facing actions instead, which fits a static site. |

## Maintaining this

- Add a new route/page → add its URL to `sitemap.xml`.
- Add a real public API → replace the empty `linkset` in `.well-known/api-catalog` with real entries and add OAuth metadata if it's protected.
- Confirm which static host this deploys to, and if it's not Netlify/Cloudflare Pages, move the `_headers` rules into that host's native header config (`vercel.json`, GitHub Pages doesn't support custom headers at all, etc).
