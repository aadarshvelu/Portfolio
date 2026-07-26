import SheetView from "./sheet.jsx";
import PublicDoc from "./PublicDoc.jsx";
import { buildJsonLd } from "./resumeSchema.js";
import { loadResume } from "./loadResume.js";

// Reads live KV per request (the saved resume), so never statically prerender.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const data = await loadResume();
  return {
    title: `${data.name} — Résumé`,
    description: `${data.name} — ${data.meta?.jobTitle || ""}. ${data.meta?.context || ""}`.slice(0, 300),
    robots: { index: true, follow: true },
  };
}

// PUBLIC preview: anyone can view the resume and download the PDF. No editing
// UI here — that lives behind Cloudflare Access at /conf.
export default async function PublicResume() {
  const data = await loadResume();
  const jsonLd = buildJsonLd(data);

  return (
    <div className="public-page">
      {/* The header IS the film strip — Open portfolio + Download actions. */}
      <div className="public-bar">
        <span className="public-bar__dot" aria-hidden="true" />
        <span className="public-bar__msg">
          My full work lives in an interactive, scroll-driven portfolio — worth a look.
        </span>
        <div className="public-bar__actions">
          {data.meta?.portfolioUrl && (
            <a className="pf-open" href={data.meta.portfolioUrl} target="_blank" rel="noopener noreferrer">
              Open portfolio
            </a>
          )}
          <a className="pf-download" href="/download">
            <svg className="c-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Download PDF
          </a>
        </div>
      </div>

      <div className="public-stage">
        <PublicDoc>
          <SheetView data={data} />
        </PublicDoc>
      </div>

      {/* Machine-readable context for crawlers / LLMs / ATS — now on the page
          they can actually reach (the editor is Access-gated). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
