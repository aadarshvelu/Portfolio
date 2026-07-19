import { useEffect, useState } from 'react'
import { audio } from './engine.js'
import { CELEB_START } from '../components/Hero/config.js'

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const cross = (p, s, T) => (p < T && s >= T) || (p > T && s <= T)

const GESTURES = ['pointerdown', 'keydown', 'touchstart', 'wheel']

/**
 * Sound is ON by default: the AudioContext auto-unlocks on the visitor's first
 * interaction (browsers block audio before any gesture, so this is as close to
 * "always on" as is possible). ONE sound only — the confetti-cone pop at the
 * celebration. A small corner button lets them mute (remembered).
 */
export default function SoundControl({ introPx }) {
  const [muted, setMuted] = useState(audio.muted)

  // auto-unlock on the first user gesture
  useEffect(() => {
    const unlock = () => {
      audio.unlock()
      GESTURES.forEach((ev) => window.removeEventListener(ev, unlock))
    }
    GESTURES.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }))
    return () => GESTURES.forEach((ev) => window.removeEventListener(ev, unlock))
  }, [])

  // scroll → sound
  useEffect(() => {
    const off = introPx || 0
    const smOf = (y) => {
      const max = document.documentElement.scrollHeight - window.innerHeight - off || 1
      return clamp01((y - off) / max)
    }
    let prevSm = smOf(window.scrollY)
    const onScroll = () => {
      const sm = smOf(window.scrollY)
      if (cross(prevSm, sm, CELEB_START)) audio.burst()     // confetti-cone pop (only sound)
      prevSm = sm
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [introPx])

  const toggle = () => {
    audio.unlock() // in case the click IS the first gesture
    const m = !muted
    audio.setMuted(m)
    setMuted(m)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Unmute' : 'Mute'}
      title={muted ? 'Unmute' : 'Mute'}
      style={{
        position: 'fixed',
        left: '16px',
        bottom: '16px',
        zIndex: 10000,
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        border: '1px solid rgba(200,161,87,0.5)',
        background: 'rgba(9,12,22,0.55)',
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)',
        color: '#f6ecd2',
        fontSize: '15px',
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.6,
        pointerEvents: 'auto',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
