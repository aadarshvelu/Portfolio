// WebMCP — exposes this site's real actions to AI agents/browsers that
// support navigator.modelContext (Chrome's WebMCP proposal). No-ops
// silently where unsupported. Static site, so tools are navigation-only.
export function registerWebMCPTools() {
  if (typeof navigator === 'undefined' || !navigator.modelContext) return

  navigator.modelContext.provideContext({
    tools: [
      {
        name: 'view_resume',
        description: "Open Aadarsh Velu's resume (preview in browser).",
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          window.open('https://resume.whoisaadar.sh', '_blank', 'noopener,noreferrer')
          return { content: [{ type: 'text', text: 'Opened resume preview.' }] }
        },
      },
      {
        name: 'download_resume',
        description: "Download Aadarsh Velu's resume as a PDF.",
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          window.open('https://resume.whoisaadar.sh/download', '_blank', 'noopener,noreferrer')
          return { content: [{ type: 'text', text: 'Started resume download.' }] }
        },
      },
      {
        name: 'scroll_to_projects',
        description: 'Scroll the portfolio to the projects section (The Project Desk).',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          const max = document.documentElement.scrollHeight - window.innerHeight
          window.scrollTo({ top: max * 0.75, behavior: 'smooth' })
          return { content: [{ type: 'text', text: 'Scrolled to projects.' }] }
        },
      },
    ],
  })
}
