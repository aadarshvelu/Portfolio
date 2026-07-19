import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { registerWebMCPTools } from './webmcp.js'

registerWebMCPTools()

// Two routes, no router: a path branch keeps the heavy WebGL/Three.js bundle
// out of /resume entirely (it lazy-loads only the page it needs).
const path = window.location.pathname.replace(/\/+$/, '')
const isResume = path === '/resume'

const Root = isResume
  ? lazy(() => import('./resume/Resume.jsx'))
  : lazy(() => import('./PortfolioExperience.jsx'))

if (!isResume) {
  window.history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
