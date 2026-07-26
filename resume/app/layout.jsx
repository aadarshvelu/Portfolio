// Two surfaces under one domain:
//   /          public preview + PDF download (indexable)
//   /download  public — triggers the PDF download
//   /conf      owner-only editor, behind Cloudflare Access (noindex — see conf/layout)
//   /api/*     owner-only, behind Cloudflare Access
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
// DM Mono — the portfolio's UI typeface, used by the portfolio-nudge banner so
// it reads as part of the same world.
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "./resume.css";

export const metadata = {
  title: "Résumé",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
