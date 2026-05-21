import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

// Smoothly fades a group of troika-text / mesh layers by returning an opacity
// number (0..1). troika <Text> has no material ref to tween, so we drive its
// `fillOpacity` prop via a gsap-tweened proxy. Cheap — fillOpacity is a
// uniform, no glyph re-layout.
export function useGroupFade(on, { duration = 0.9, delay = 0 } = {}) {
  const [opacity, setOpacity] = useState(0)
  const proxy = useRef({ v: 0 })

  useEffect(() => {
    const sync = () => setOpacity(proxy.current.v)
    gsap.to(proxy.current, {
      v: on ? 1 : 0,
      duration: on ? duration : duration * 0.4,
      delay: on ? delay : 0,
      ease: 'power2.out',
      onUpdate: sync,
      onComplete: sync,
      overwrite: true,
    })
  }, [on, duration, delay])

  return opacity
}
