"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useResumeData } from "../resumeStore.js";
import SheetView from "../sheet.jsx";

// A4 height in CSS px at 96dpi — used to convert overflow into millimetres.
const A4_PX = 1123;

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
            Not printed on the resume. Rendered as schema.org structured data + meta
            description in the head of the public page — the legitimate way to give parsers
            depth the one page can't hold (e.g. that your portfolio is a unique scroll experience).
          </p>
          <Field
            label="Headline job title"
            value={data.meta?.jobTitle || ""}
            onChange={(v) => update((d) => { d.meta.jobTitle = v; })}
          />
          <Field
            label="Portfolio URL (also used by the ← Portfolio link)"
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
/* Editor page (/conf) — owner-only, behind Cloudflare Access.                */
/* ========================================================================== */
export default function ResumeEditor() {
  const { data, update, reset, saveToCloud, cloudStatus } = useResumeData();
  // idle | uploading | uploaded | error
  const [uploadStatus, setUploadStatus] = useState("idle");
  const fileInputRef = useRef(null);

  const uploadPdf = async (file) => {
    setUploadStatus("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume-pdf", { method: "POST", body: form });
      if (!res.ok) throw new Error(`upload failed: ${res.status}`);
      setUploadStatus("uploaded");
      setTimeout(() => setUploadStatus("idle"), 2500);
    } catch {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3500);
    }
  };

  // Live A4-fit meter. The sheet mirrors the print output exactly, so
  // scrollHeight − clientHeight is the true overflow.
  const sheetRef = useRef(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (el) setOverflow(el.scrollHeight - el.clientHeight);
  }, [data]);
  const overMm = Math.round((overflow / A4_PX) * 297);
  const over = overflow > 1;

  useEffect(() => {
    document.title = `Aadarsh Resume`;
  }, [data.name]);

  return (
    <div className="resume-app">
      <ControlPane data={data} update={update} reset={reset} overflow={overflow} overMm={overMm} />

      <main className="stage">
        <div className="stage-toolbar">
          <a className="resume-btn resume-btn--ghost" href="/">
            ← Public view
          </a>
          {over && <span className="stage-alert">⚠ Over one page by ~{overMm}mm</span>}
          <span className={`cloud-status cloud-status--${cloudStatus}`}>
            {cloudStatus === "saving" && "Saving…"}
            {cloudStatus === "saved" && "✓ Saved to cloud"}
            {cloudStatus === "error" && "⚠ Save failed"}
            {cloudStatus === "loading-cloud" && "Checking cloud…"}
          </span>
          <button type="button" className="resume-btn resume-btn--cloud" onClick={saveToCloud} disabled={cloudStatus === "saving"}>
            ☁ Save to Cloud
          </button>
          <button
            type="button"
            className="resume-btn resume-btn--print"
            onClick={async () => {
              // Guarantee the webfont has finished downloading before the browser
              // rasterizes for print — printing mid-load silently substitutes a
              // fallback font into the PDF.
              await document.fonts.ready;
              window.print();
            }}
          >
            ⭳ Download PDF
          </button>

          {/* Print-then-upload: after Download PDF saves a file locally, pick that
              same file here to publish it — this is what /download serves. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadPdf(file);
            }}
          />
          <span className={`cloud-status cloud-status--${uploadStatus === "uploaded" ? "saved" : uploadStatus === "error" ? "error" : "idle"}`}>
            {uploadStatus === "uploading" && "Uploading…"}
            {uploadStatus === "uploaded" && "✓ Published"}
            {uploadStatus === "error" && "⚠ Upload failed"}
          </span>
          <button
            type="button"
            className="resume-btn resume-btn--upload"
            disabled={uploadStatus === "uploading"}
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆ Upload PDF to Cloud
          </button>
        </div>

        <div className="stage-scroll">
          <SheetView data={data} over={over} innerRef={sheetRef} />
        </div>
      </main>
    </div>
  );
}
