// Owner-only editor for the resume. This whole app should sit behind
// Cloudflare Access at the zone level (see project README) — everything
// under this domain except /download is meant for the owner only.
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./resume.css";

export const metadata = {
  title: "Resume editor",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
