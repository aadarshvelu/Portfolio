// Shared, presentational A4 sheet — no hooks, no client state, so it renders
// identically as a Server Component (the public "/" preview) and inside the
// Client editor ("/conf"). Pass innerRef to get a handle on the .sheet DOM node
// (the editor uses it for the live A4-overflow meter); the public page omits it.

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

function contactIcon(c) {
  const s = `${c.href || ""} ${c.label || ""}`.toLowerCase();
  if (s.includes("github")) return BRAND_ICONS.github;
  if (s.includes("linkedin")) return BRAND_ICONS.linkedin;
  return null;
}

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

export default function SheetView({ data, over, innerRef }) {
  const { name, contact, summary, skills, certification, projects, experience } = data;
  return (
    <div className={`sheet${over ? " sheet--over" : ""}`} ref={innerRef}>
      <header>
        <h1 className="sheet__name">{name}</h1>
        <div className="sheet__contact">
          {contact.map((c, i) => {
            const icon = contactIcon(c);
            // pin + icon + label stay glued as one unbreakable unit (c-item),
            // so a wrap can only happen BETWEEN items, never inside one.
            const inner = (
              <span className="c-item">
                {c.pin && "📍 "}
                {icon}
                {c.label}
              </span>
            );
            return (
              <span key={i}>
                {i > 0 && <span className="sep">|</span>}
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </span>
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

      <SectionTitle>Personal Projects</SectionTitle>
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
}
