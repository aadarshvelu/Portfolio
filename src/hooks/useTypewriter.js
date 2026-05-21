import { useEffect, useState } from 'react'

// Reveals `text` character-by-character once `start` flips true, with a small
// per-character jitter (ported from the prototype's typeText).
export function useTypewriter(text, { speed = 40, start = false } = {}) {
  const [out, setOut] = useState('')

  useEffect(() => {
    if (!start) {
      setOut('')
      return
    }

    let i = 0
    let timer
    setOut('')

    const tick = () => {
      if (i >= text.length) return
      i += 1
      setOut(text.slice(0, i))
      timer = setTimeout(tick, speed + (Math.random() * 18 - 9))
    }
    tick()

    return () => clearTimeout(timer)
  }, [text, speed, start])

  return out
}
