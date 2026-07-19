import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` locally simulate the KV/R2 bindings declared in
// wrangler.jsonc (backed by local Miniflare storage, not your real Cloudflare
// account) — without this, any route using getCloudflareContext() 500s in dev.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This is a small owner-only utility app with no established lint pipeline
  // (no eslint-config-next installed) — don't let missing lint plugin config
  // block production builds.
  eslint: { ignoreDuringBuilds: true },
  // This app lives nested inside the main portfolio repo (its own
  // package-lock.json alongside the parent's) — pin the trace root so Next
  // doesn't guess wrong between the two.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
