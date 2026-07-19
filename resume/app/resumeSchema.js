// Build a schema.org Person from the resume data — declared machine-readable
// context (crawlers / LLMs / ATS). Rendered server-side into the public "/"
// page's <head>, which is where it actually gets seen.
export function buildJsonLd(data) {
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
