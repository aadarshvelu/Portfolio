import { useEffect, useState } from 'react'
import '@fontsource/anton/400.css'
import './countdown.css'

/**
 * CountdownOverlay — a film academy-leader that covers the jump to a chapter.
 * Portalled to <body> by Hero, above every layer. Self-timed: counts 3·2·1 at
 * STEP ms each, flashes, then calls onDone (Hero unmounts it). The actual scroll
 * jump is fired by Hero the instant this mounts, so the scene settles behind the
 * leader and is revealed clean on the flash.
 */
const STEP = 460 // ms per number — matches the sweep-hand revolution
const NUMS = [3, 2, 1]

export default function CountdownOverlay({ chapter, onDone }) {
  const [i, setI] = useState(0) // index into NUMS
  const [flash, setFlash] = useState(false)
  const [out, setOut] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setI(1), STEP),
      setTimeout(() => setI(2), STEP * 2),
      setTimeout(() => {
        setFlash(true)
        setOut(true)
      }, STEP * 3),
      setTimeout(() => onDone(), STEP * 3 + 360),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  return (
    <div className={`cd-overlay${out ? ' cd-out' : ''}`}>
      <div className="cd-grain" />

      <div className="cd-leader">
        <svg className="cd-dial" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="cd-ring" cx="100" cy="100" r="94" />
          <circle className="cd-ring" cx="100" cy="100" r="66" />
          <line className="cd-cross" x1="100" y1="6" x2="100" y2="194" />
          <line className="cd-cross" x1="6" y1="100" x2="194" y2="100" />
          <g className="cd-sweep">
            <path className="cd-wedge" d="M100,100 L35,35 A92,92 0 0 1 100,8 Z" />
            <line className="cd-sweep-line" x1="100" y1="100" x2="100" y2="8" />
          </g>
        </svg>

        <div className="cd-num">
          {/* key re-triggers the pop animation on each number */}
          <span key={i}>{NUMS[i]}</span>
        </div>
      </div>

      <div className="cd-label">
        <b>Now Showing</b> — {chapter?.tag || ''}
      </div>

      <div className={`cd-flash${flash ? ' on' : ''}`} />
    </div>
  )
}
