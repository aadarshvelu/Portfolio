import { useEffect, useRef } from 'react'
import './ScrollCue.css'
import { UPGRADE_ENTER, PEEL_START, PEEL_END, CRAFTS_START } from './Hero/config.js'
import { detectBreakpoint } from '../hooks/useBreakpoint.js'
import { SCROLL_CUE, SCROLL_CUE_FALLBACK } from './scrollCueConfig.js'

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

// Which chapter the visitor is in — drives both the placement lookup and the
// ticket's "· <heading>" suffix.
const LABELS = { enter: 'Enter', origin: 'The Origin', upgrade: 'The Upgrade', roster: 'The Roster', work: 'The Work' }
function sectionKey(inRoom, sm) {
  if (inRoom) return 'enter'
  if (sm < UPGRADE_ENTER) return 'origin'
  if (sm < PEEL_START) return 'upgrade'
  if (sm < CRAFTS_START) return 'roster'
  return 'work'
}

/**
 * A little lottery-ticket / stamp scroll cue — "SCROLL · <chapter>" + a downward
 * hand — fixed for the whole journey. Placement is fully config-driven: see
 * scrollCueConfig.js for a position per breakpoint × section (tweak there).
 * Decorative (pointer-events none); opacity, placement, and heading are set
 * imperatively on scroll (no re-render). Starts hidden (CSS opacity:0 → no boot
 * flash); fades in with the room and out at the very end.
 */
export default function ScrollCue({ introPx = 0 }) {
  const cueRef = useRef(null)
  const sufRef = useRef(null)

  useEffect(() => {
    const cue = cueRef.current
    const suf = sufRef.current
    const off = introPx || 0
    let prevStamp = ''
    let prevLabel = ''
    let prevVert = null

    // Apply a position object (from the config) as inline styles.
    const place = (pos) => {
      if (!cue) return
      cue.style.left = pos.left ?? 'auto'
      cue.style.right = pos.right ?? 'auto'
      cue.style.top = pos.top ?? 'auto'
      cue.style.bottom = pos.bottom ?? 'auto'
      const tr = []
      if (pos.translate) tr.push(`translate(${pos.translate})`)
      if (pos.rotate != null) tr.push(`rotate(${pos.rotate}deg)`)
      cue.style.transform = tr.join(' ')
      const vert = !!pos.vertical
      if (vert !== prevVert) {
        cue.classList.toggle('scrollcue--vertical', vert)
        prevVert = vert
      }
    }

    const onScroll = () => {
      const y = window.scrollY
      const docMax = document.documentElement.scrollHeight - window.innerHeight || 1
      const p = y / docMax
      const roomP = off > 0 ? clamp01(y / off) : 1
      const fadeIn = smoothstep(clamp01((roomP - 0.12) / 0.1))
      const fadeOut = 1 - clamp01((p - 0.9) / 0.08)

      const heroMax = document.documentElement.scrollHeight - window.innerHeight - off || 1
      const sm = clamp01((y - off) / heroMax)
      const inRoom = y < off

      // Hide entirely while the page-peel is turning (Upgrade → Roster reveal) —
      // the cue must not sit on top of the peeling page. Small lead/lag margins
      // so it's already gone before the peel is visible and only returns once the
      // reel-road has settled.
      const inPeel = !inRoom && sm > PEEL_START - 0.015 && sm < PEEL_END + 0.01
      if (cue) cue.style.opacity = inPeel ? '0' : String(fadeIn * fadeOut)

      const bp = detectBreakpoint()
      const key = sectionKey(inRoom, sm)

      // placement — look up config[breakpoint][section]; only re-apply on change
      const stamp = bp + '|' + key
      if (stamp !== prevStamp) {
        const conf = (SCROLL_CUE[bp] && SCROLL_CUE[bp][key]) || SCROLL_CUE_FALLBACK
        place(conf)
        prevStamp = stamp
      }

      // chapter heading
      const label = LABELS[key]
      if (suf && label !== prevLabel) {
        suf.textContent = ' · ' + label
        prevLabel = label
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [introPx])

  return (
    <div className="scrollcue" ref={cueRef} aria-hidden="true">
      <span className="scrollcue__label">
        Scroll<span className="scrollcue__suffix" ref={sufRef}> · Enter</span>
      </span>
      <span className="scrollcue__hand" aria-hidden="true">{"☟︎"}</span>
    </div>
  )
}
