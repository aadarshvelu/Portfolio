# Resume editor (Cloudflare Pages + Next.js)

Owner-only resume editor. Edits save to Cloudflare KV; the PDF you print
locally gets uploaded to R2 and served publicly at `/download` for your
portfolio to link to. See `../src/resume/Resume.jsx` in the main portfolio —
its "Download résumé" button points at `https://<this-app's-domain>/download`.

## Route map

| Route | Access | Purpose |
|---|---|---|
| `/` | **owner only** | The editor |
| `/api/resume` (GET/POST) | **owner only** | Load/save resume JSON in KV |
| `/api/resume-pdf` (POST) | **owner only** | Upload the printed PDF to R2 |
| `/download` (GET) | **public** | Serves the current PDF — this is the link your portfolio uses |

`/download` must **never** end up behind the login wall below — that's the
one thing recruiters/visitors need to reach without authenticating.

## One-time Cloudflare setup

### 1. Create the KV namespace and R2 bucket

```
cd resume
npx wrangler kv namespace create RESUME_KV
npx wrangler r2 bucket create resume-pdf
```

Paste the KV id the first command prints into `wrangler.jsonc` (`kv_namespaces[0].id`).

### 2. Create the Pages project and bind everything

Deploy once so the Pages project exists (or connect the repo via git
integration in the dashboard, pointed at this `resume/` subdirectory as the
project root, build command `npm run build`, build output — handled by the
OpenNext adapter, see `package.json`'s `deploy` script for the CLI path).

Then in **Pages project → Settings**:
- **Functions → KV namespace bindings**: variable name `RESUME_KV` → the namespace you created.
- **Functions → R2 bucket bindings**: variable name `RESUME_PDF` → bucket `resume-pdf`.
- **Environment variables**: `OWNER_EMAIL` = the email you'll log into Access with (must match exactly, case-insensitive).
- **Custom domains**: add `resume.whoisaadar.sh` (or whatever subdomain you choose — update the URL hardcoded in `../src/resume/Resume.jsx` to match).

### 3. Lock it down with Cloudflare Access — the part that actually protects it

Zero Trust dashboard → **Access → Applications → Add an application → Self-hosted**:

**Application 1 — the editor + API (protected)**
- Domain: `resume.whoisaadar.sh`
- Path: leave as the whole domain, OR explicitly list `/`, `/api/resume`, `/api/resume-pdf` if you want to be precise
- Policy: Include → Emails → your email → Allow
- Session duration: whatever you're comfortable with (e.g. 24h)

**Application 2 — the public download (bypass)**
- Domain: `resume.whoisaadar.sh`
- Path: `/download`
- Policy: **Bypass** (not Allow) — this exempts it from authentication entirely

Cloudflare matches the more specific path first, so `/download` stays public
even though the rest of the domain requires login. Verify by opening
`https://resume.whoisaadar.sh/` in a private/incognito window — you should
hit the Access login page — then `https://resume.whoisaadar.sh/download`
in the same window — it should just work (or 404 if nothing's been
uploaded yet), no login prompt.

### 4. Also lock the `*.pages.dev` fallback domain

Every Pages project gets a free `<project-name>.pages.dev` URL that's live
regardless of your custom domain. Add a second copy of Application 1 & 2
scoped to that hostname too (Cloudflare Access applications are per-hostname),
or disable/restrict preview URLs in the Pages project settings if you don't
need them.

## Local development

```
npm install
npm run dev
```

Local dev simulates the KV/R2 bindings via `initOpenNextCloudflareForDev()`
(already wired in `next.config.mjs`) — data is stored locally, not in your
real Cloudflare account, and there's no Access layer locally (every request
acts as if unauthenticated unless `OWNER_EMAIL` is blank in `wrangler.jsonc`,
which skips the defense-in-depth check for local testing).
