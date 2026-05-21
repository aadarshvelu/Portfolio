import { useEffect } from 'react'
import gsap from 'gsap'

// Fades a target's numeric property when `on` flips — the WebGL stand-in for
// the prototype's CSS `.on`-class opacity transitions. `target` is usually a
// material (target.opacity) or a uniform ({ value }).
export function useFade(
  target,
  on,
  { duration = 1, delay = 0, ease = 'power2.out', prop = 'opacity', to = 1 } = {},
) {
  useEffect(() => {
    const obj = target?.current ?? target
    if (!obj) return
    if (on) {
      gsap.to(obj, { [prop]: to, duration, delay, ease, overwrite: true })
    } else {
      gsap.killTweensOf(obj)
      obj[prop] = 0
    }
  }, [target, on, duration, delay, ease, prop, to])
}
