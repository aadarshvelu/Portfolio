import { useEffect, useRef } from 'react'
import './ScrollCue.css'
import { UPGRADE_ENTER, PEEL_START, CRAFTS_START } from './Hero/config.js'

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)
const POS = ['scrollcue--center', 'scrollcue--roster', 'scrollcue--vertical']

// Which chapter the visitor is in — shown as the ticket's "· <heading>".
function sectionLabel(inRoom, sm) {
  if (inRoom) return 'Enter'
  if (sm < UPGRADE_ENTER) return 'The Origin'
  if (sm < PEEL_START) return 'The Upgrade'
  if (sm < CRAFTS_START) return 'The Roster'
  return 'The Work'
}

/**
 * A little lottery-ticket / stamp scroll cue — "SCROLL · <chapter>" + a downward
 * hand — fixed for the whole journey. Placement is responsive by section:
 *   • mobile / tablet    → always centred at the bottom
 *   • desktop default    → centred at the bottom
 *   • desktop · Roster   → the empty right-middle space
 *   • desktop · Work     → vertical, on the right
 * Decorative (pointer-events none); opacity, placement, and heading are set
 * imperatively on scroll (no re-render). Hidden while the room's welcome cue is
 * up; fades out at the very end.
 */
export default function ScrollCue({ introPx = 0 }) {
  const cueRef = useRef(null)
  const sufRef = useRef(null)

  useEffect(() => {
    const cue = cueRef.current
    const suf = sufRef.current
    const off = introPx || 0
    let prevPos = ''
    let prevLabel = ''
    const onScroll = () => {
      const y = window.scrollY
      const docMax = document.documentElement.scrollHeight - window.innerHeight || 1
      const p = y / docMax
      const roomP = off > 0 ? clamp01(y / off) : 1
      const fadeIn = smoothstep(clamp01((roomP - 0.12) / 0.1))
      const fadeOut = 1 - clamp01((p - 0.9) / 0.08)
      if (cue) cue.style.opacity = String(fadeIn * fadeOut)

      const heroMax = document.documentElement.scrollHeight - window.innerHeight - off || 1
      const sm = clamp01((y - off) / heroMax)
      const inRoom = y < off
      const isDesktop = window.innerWidth >= 1024

      // placement — desktop moves it per section; mobile/tablet stay centred
      let pos = 'scrollcue--center'
      if (!inRoom && isDesktop) {
        if (sm >= PEEL_START && sm < CRAFTS_START) pos = 'scrollcue--roster'
        else if (sm >= CRAFTS_START) pos = 'scrollcue--vertical'
      }
      if (cue && pos !== prevPos) {
        cue.classList.remove(...POS)
        cue.classList.add(pos)
        prevPos = pos
      }

      // chapter heading
      const label = sectionLabel(inRoom, sm)
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
    <div className="scrollcue scrollcue--center" ref={cueRef} aria-hidden="true">
      <span className="scrollcue__label">
        Scroll<span className="scrollcue__suffix" ref={sufRef}> · Enter</span>
      </span>
      <span className="scrollcue__hand" aria-hidden="true">{"☟︎"}</span>
    </div>
  )
}
