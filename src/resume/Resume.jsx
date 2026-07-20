import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useResumeData } from "./resumeStore.js";
// Resume webfont — bundled into this lazy chunk only (never the main app).
// Inter: clean geometric sans, straight l/I strokes (no stylistic flourish).
// Light (300) for running body text, Medium (500) for headings/emphasis.
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./resume.css";

// A4 height in CSS px at 96dpi — used to convert overflow into millimetres.
const A4_PX = 1123;

// Build a schema.org Person from the resume data. This is emitted into <head>
// as declared machine-readable context — the standard, non-deceptive channel for
// giving crawlers/LLMs/ATS depth the printed sheet can't hold.
function buildJsonLd(data) {
  const { name, contact, summary, meta, experience, certification, skills } = data;
  // knowsAbout = curated meta list + every skill listed in the Skills section.
  const skillTerms = (skills || []).flatMap((s) =>
    (s.items || "").split(",").map((t) => t.trim()).filter(Boolean),
  );
  const knowsAbout = [...new Set([...(meta?.knowsAbout || []), ...skillTerms])];
  const email = contact.find((c) => (c.href || "").startsWith("mailto:"));
  const tel = contact.find((c) => (c.href || "").startsWith("tel:"));
  const location = contact.find((c) => c.pin);
  const sameAs = contact
    .map((c) => c.href)
    .filter((h) => h && /^https?:\/\//.test(h));

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: meta?.jobTitle || experience?.[0]?.role,
    description: `${summary} ${meta?.context || ""}`.trim(),
    url: meta?.portfolioUrl || undefined,
    email: email ? email.href.replace("mailto:", "") : undefined,
    telephone: tel ? tel.href.replace("tel:", "") : undefined,
    address: location ? { "@type": "PostalAddress", name: location.label } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    knowsAbout: knowsAbout.length ? knowsAbout : undefined,
    hasOccupation: experience?.map((e) => ({
      "@type": "Occupation",
      name: e.role,
      description: e.bullets?.join(" "),
    })),
    alumniOf: certification?.map((c) => ({ "@type": "Organization", name: c.title })),
  };
}

// Upsert an element in <head> keyed by id, so re-runs replace rather than stack.
function upsertHead(tag, id, apply) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement(tag);
    el.id = id;
    document.head.appendChild(el);
  }
  apply(el);
  return el;
}

/* Inline brand marks for social contacts — self-contained SVG (no external
   request), monochrome via currentColor so they print cleanly. */
const BRAND_ICONS = {
  github: (
    <svg className="c-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  ),
  linkedin: (
    <svg className="c-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
};

// Detect a contact's brand from its link/label so no extra data field is needed.
function contactIcon(c) {
  const s = `${c.href || ""} ${c.label || ""}`.toLowerCase();
  if (s.includes("github")) return BRAND_ICONS.github;
  if (s.includes("linkedin")) return BRAND_ICONS.linkedin;
  return null;
}

/* ========================================================================== */
/* The sheet — pure, print-ready preview. No editing UI lives here.           */
/* ========================================================================== */
function SectionTitle({ children }) {
  return (
    <h2 className="sec-title">
      <span>{children}</span>
    </h2>
  );
}

function LeaderRow({ title, date }) {
  return (
    <div className="entry__head">
      <span className="diamond" />
      <span className="entry__title">
        <span>{title}</span>
        <span className="leader__fill" />
        <span className="leader__date">{date}</span>
      </span>
    </div>
  );
}

const SheetView = React.forwardRef(function SheetView({ data, over }, ref) {
  const { name, contact, summary, skills, certification, projects, experience } = data;
  return (
    <div className={`sheet${over ? " sheet--over" : ""}`} ref={ref}>
      <header>
        <h1 className="sheet__name">{name}</h1>
        <div className="sheet__contact">
          {contact.map((c, i) => {
            const icon = contactIcon(c);
            // pin + icon + label stay glued as one unbreakable unit (c-item),
            // so a wrap can only happen BETWEEN items, never inside one.
            const inner = (
              <span className="c-item">
                {icon}
                {c.label}
              </span>
            );
            return (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">|</span>}
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </React.Fragment>
            );
          })}
        </div>
      </header>

      <SectionTitle>Professional Summary</SectionTitle>
      <p className="summary-text">{summary}</p>

      {/* Never print a row/bullet that's still blank (e.g. a "+ Add" click left
          unfilled) — it would otherwise show up as a bare label with nothing
          after it, like "Group:" with no items. */}
      {skills?.filter((s) => s.items?.trim()).length > 0 && (
        <>
          <SectionTitle>Skills</SectionTitle>
          <div className="skills">
            {skills
              .filter((s) => s.items?.trim())
              .map((s, i) => (
                <p className="skill-row" key={i}>
                  <b>{s.group}:</b> {s.items}
                </p>
              ))}
          </div>
        </>
      )}

      <SectionTitle>Work Experience</SectionTitle>
      {experience.map((e, i) => (
        <div className="entry" key={i}>
          <LeaderRow title={e.role} date={e.date} />
          <ul className="bullets">
            {e.bullets
              .filter((b) => b.trim())
              .map((b, j) => (
                <li key={j}>{b}</li>
              ))}
          </ul>
        </div>
      ))}

      <SectionTitle>Projects</SectionTitle>
      {projects.map((p, i) => (
        <div className="entry" key={i}>
          <p className="proj-body">
            <span className="diamond" />
            {p.link ? (
              <a className="proj-link" href={p.link} target="_blank" rel="noreferrer">
                {p.name}
              </a>
            ) : (
              <span className="proj-name">{p.name}</span>
            )}
            {": "}
            {p.blurb}
          </p>
          {p.tech && (
            <p className="proj-tech">
              <b>Tech:</b> {p.tech}
            </p>
          )}
        </div>
      ))}

      <SectionTitle>Certification and Education</SectionTitle>
      {certification.map((c, i) => (
        <div className="entry" key={i}>
          <LeaderRow title={c.title} date={c.date} />
          {c.sub && <p className="sub-line sub-line--indent">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
});

/* ========================================================================== */
/* Control pane — one text box per field, add/delete per list.                */
/* ========================================================================== */
function Field({ label, value, onChange, textarea, rows, placeholder }) {
  const common = {
    value: value ?? "",
    placeholder,
    onChange: (e) => onChange(e.target.value),
    className: "cp-input",
  };
  return (
    <label className="cp-field">
      {label && <span className="cp-label">{label}</span>}
      {textarea ? <textarea rows={rows || 2} {...common} /> : <input type="text" {...common} />}
    </label>
  );
}

function Card({ title, onDelete, children }) {
  return (
    <div className="cp-card">
      <div className="cp-card__bar">
        <span>{title}</span>
        <button type="button" className="cp-del" onClick={onDelete}>
          Delete
        </button>
      </div>
      {children}
    </div>
  );
}

function ControlPane({ data, update, reset, overflow, overMm }) {
  const over = overflow > 1;
  return (
    <aside className="control-pane">
      <div className="cp-head">
        <h2 className="cp-title">Resume editor</h2>
        <div className={`cp-fit ${over ? "cp-fit--over" : "cp-fit--ok"}`}>
          {over ? `⚠ Exceeds A4 by ~${overMm}mm — trim to fit one page` : "✓ Fits on one A4 page"}
        </div>
      </div>

      <div className="cp-scroll">
        {/* Header */}
        <section className="cp-group">
          <h3 className="cp-group__title">Header</h3>
          <Field label="Full name" value={data.name} onChange={(v) => update((d) => { d.name = v; })} />

          <div className="cp-sublabel">Contact details</div>
          {data.contact.map((c, i) => (
            <Card
              key={i}
              title={`Detail ${i + 1}`}
              onDelete={() => update((d) => { d.contact.splice(i, 1); })}
            >
              <Field
                label="Text"
                value={c.label}
                onChange={(v) => update((d) => { d.contact[i].label = v; })}
              />
              <Field
                label="Link (optional — mailto:, tel:, https://)"
                value={c.href || ""}
                placeholder="leave blank for plain text"
                onChange={(v) => update((d) => { d.contact[i].href = v.trim() || null; })}
              />
            </Card>
          ))}
          <button
            type="button"
            className="cp-add"
            onClick={() => update((d) => { d.contact.push({ label: "New detail", href: null }); })}
          >
            + Add contact detail
          </button>
        </section>

        {/* Summary */}
        <section className="cp-group">
          <h3 className="cp-group__title">Professional Summary</h3>
          <Field
            textarea
            rows={5}
            value={data.summary}
            onChange={(v) => update((d) => { d.summary = v; })}
          />
        </section>

        {/* Skills */}
        <section className="cp-group">
          <h3 className="cp-group__title">Skills</h3>
          <p className="cp-note">
            Inferred from the rest of your resume — verify and edit to what's true. Each row
            prints as “<b>Group:</b> items”. These also feed the machine-readable skill list.
          </p>
          {data.skills.map((s, i) => (
            <Card
              key={i}
              title={`Row ${i + 1}`}
              onDelete={() => update((d) => { d.skills.splice(i, 1); })}
            >
              <Field label="Group" value={s.group} onChange={(v) => update((d) => { d.skills[i].group = v; })} />
              <Field
                label="Items (comma-separated)"
                value={s.items}
                onChange={(v) => update((d) => { d.skills[i].items = v; })}
              />
            </Card>
          ))}
          <button
            type="button"
            className="cp-add"
            onClick={() => update((d) => { d.skills.push({ group: "Group", items: "" }); })}
          >
            + Add skill row
          </button>
        </section>

        {/* Experience */}
        <section className="cp-group">
          <h3 className="cp-group__title">Work Experience</h3>
          {data.experience.map((e, i) => (
            <Card
              key={i}
              title={`Position ${i + 1}`}
              onDelete={() => update((d) => { d.experience.splice(i, 1); })}
            >
              <Field label="Role, Company" value={e.role} onChange={(v) => update((d) => { d.experience[i].role = v; })} />
              <Field label="Dates" value={e.date} onChange={(v) => update((d) => { d.experience[i].date = v; })} />

              <div className="cp-sublabel">Bullets</div>
              {e.bullets.map((b, j) => (
                <div className="cp-bullet" key={j}>
                  <textarea
                    rows={2}
                    className="cp-input"
                    value={b}
                    onChange={(ev) => update((d) => { d.experience[i].bullets[j] = ev.target.value; })}
                  />
                  <button
                    type="button"
                    className="cp-del-x"
                    title="Delete bullet"
                    onClick={() => update((d) => { d.experience[i].bullets.splice(j, 1); })}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="cp-add-sm"
                onClick={() => update((d) => { d.experience[i].bullets.push(""); })}
              >
                + Add bullet
              </button>
            </Card>
          ))}
          <button
            type="button"
            className="cp-add"
            onClick={() =>
              update((d) => {
                d.experience.push({ role: "Role, Company", date: "Dates", bullets: ["Describe your impact…"] });
              })
            }
          >
            + Add position
          </button>
        </section>

        {/* Projects */}
        <section className="cp-group">
          <h3 className="cp-group__title">Projects</h3>
          {data.projects.map((p, i) => (
            <Card
              key={i}
              title={`Project ${i + 1}`}
              onDelete={() => update((d) => { d.projects.splice(i, 1); })}
            >
              <Field label="Name" value={p.name} onChange={(v) => update((d) => { d.projects[i].name = v; })} />
              <Field
                label="Link (optional — makes the name clickable)"
                value={p.link || ""}
                placeholder="https://…"
                onChange={(v) => update((d) => { d.projects[i].link = v.trim(); })}
              />
              <Field
                label="Tech (optional)"
                value={p.tech || ""}
                placeholder="React, Node.js, …"
                onChange={(v) => update((d) => { d.projects[i].tech = v; })}
              />
              <Field
                textarea
                rows={3}
                label="Description"
                value={p.blurb}
                onChange={(v) => update((d) => { d.projects[i].blurb = v; })}
              />
            </Card>
          ))}
          <button
            type="button"
            className="cp-add"
            onClick={() => update((d) => { d.projects.push({ name: "Project", link: "", tech: "", blurb: "What it does…" }); })}
          >
            + Add project
          </button>
        </section>

        {/* Certification & Education */}
        <section className="cp-group">
          <h3 className="cp-group__title">Certification and Education</h3>
          {data.certification.map((c, i) => (
            <Card
              key={i}
              title={`Item ${i + 1}`}
              onDelete={() => update((d) => { d.certification.splice(i, 1); })}
            >
              <Field label="Title" value={c.title} onChange={(v) => update((d) => { d.certification[i].title = v; })} />
              <Field label="Date" value={c.date} onChange={(v) => update((d) => { d.certification[i].date = v; })} />
              <Field
                label="Sub-line (optional)"
                value={c.sub || ""}
                onChange={(v) => update((d) => { d.certification[i].sub = v; })}
              />
            </Card>
          ))}
          <button
            type="button"
            className="cp-add"
            onClick={() => update((d) => { d.certification.push({ title: "New item", date: "Year", sub: "" }); })}
          >
            + Add certification / education
          </button>
        </section>

        {/* Machine context — structured data, not shown on the sheet */}
        <section className="cp-group">
          <h3 className="cp-group__title">Machine context (for LLMs / crawlers)</h3>
          <p className="cp-note">
            Not printed on the resume. Emitted as standard schema.org structured data +
            meta description in the page head — the legitimate way to give parsers depth
            the one page can't hold (e.g. that your portfolio is a unique scroll experience).
          </p>
          <Field
            label="Headline job title"
            value={data.meta?.jobTitle || ""}
            onChange={(v) => update((d) => { d.meta.jobTitle = v; })}
          />
          <Field
            label="Portfolio URL"
            value={data.meta?.portfolioUrl || ""}
            onChange={(v) => update((d) => { d.meta.portfolioUrl = v; })}
          />
          <Field
            textarea
            rows={6}
            label="Context paragraph (keep it truthful)"
            value={data.meta?.context || ""}
            onChange={(v) => update((d) => { d.meta.context = v; })}
          />
          <Field
            label="Areas of expertise (comma-separated)"
            value={(data.meta?.knowsAbout || []).join(", ")}
            onChange={(v) =>
              update((d) => {
                d.meta.knowsAbout = v.split(",").map((s) => s.trim()).filter(Boolean);
              })
            }
          />
        </section>

        <button
          type="button"
          className="cp-reset"
          onClick={() => {
            if (confirm("Discard all edits and restore the original resume?")) reset();
          }}
        >
          Reset to original
        </button>
      </div>
    </aside>
  );
}

/* ========================================================================== */
/* Page                                                                        */
/* ========================================================================== */
export default function Resume() {
  const { data, update, reset } = useResumeData();

  // Live A4-fit meter. The sheet mirrors the print output exactly (no edit
  // chrome lives on it now), so scrollHeight − clientHeight is the true overflow.
  const sheetRef = useRef(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (el) setOverflow(el.scrollHeight - el.clientHeight);
  }, [data]);
  const overMm = Math.round((overflow / A4_PX) * 297);
  const over = overflow > 1;

  // Emit machine context into <head> — JSON-LD + meta description — and keep it
  // in sync with edits. This is what an LLM/crawler reading the page picks up.
  useEffect(() => {
    document.title = `${data.name} — Résumé`;
    upsertHead("script", "resume-jsonld", (el) => {
      el.type = "application/ld+json";
      el.textContent = JSON.stringify(buildJsonLd(data));
    });
    upsertHead("meta", "resume-meta-desc", (el) => {
      el.setAttribute("name", "description");
      el.setAttribute(
        "content",
        `${data.name} — ${data.meta?.jobTitle || ""}. ${data.meta?.context || ""}`.slice(0, 300),
      );
    });
  }, [data]);

  return (
    <div className="resume-app">
      <ControlPane data={data} update={update} reset={reset} overflow={overflow} overMm={overMm} />

      <main className="stage">
        <div className="stage-toolbar">
          <a className="resume-btn resume-btn--ghost" href="/">
            ← Portfolio
          </a>
          {over && <span className="stage-alert">⚠ Over one page by ~{overMm}mm</span>}
          <button
            type="button"
            className="resume-btn resume-btn--print"
            onClick={async () => {
              // Guarantee Inter has actually finished downloading before the
              // browser rasterizes the page for print — printing mid-load can
              // silently substitute a fallback font into the PDF.
              await document.fonts.ready;
              window.print();
            }}
          >
            ⭳ Download PDF
          </button>
        </div>

        <div className="stage-scroll">
          <SheetView data={data} over={over} ref={sheetRef} />
        </div>
      </main>
    </div>
  );
}
