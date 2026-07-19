// The editor is owner-only (Cloudflare Access) and must never be indexed even
// if the Access policy is ever misconfigured.
export const metadata = {
  title: "Resume editor",
  robots: { index: false, follow: false },
};

export default function ConfLayout({ children }) {
  return children;
}
