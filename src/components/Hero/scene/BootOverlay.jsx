import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'

/**
 * BootOverlay — the Hero's boot mask: a black plane that covers the scene while
 * its layers stage in (useBootSequence), then lifts on `maskGone`.
 *
 * The "Life is a film. This is my story." opening line now plays in the Room's
 * opening (ConceptIntro) — the Hero sits under the Room and is revealed by the
 * CRT portal, so its own intro line would only ever play hidden. The mask stays
 * so the staged reveal is clean if the Hero is ever seen booting on its own.
 */
export default function BootOverlay({ maskGone }) {
  const L = useLayout()
  const maskMat = useRef()

  useEffect(() => {
    if (maskGone && maskMat.current) {
      gsap.to(maskMat.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true,
      })
    }
  }, [maskGone])

  return (
    <mesh renderOrder={ORDER.bootMask} position={[0, 0, 0]}>
      <planeGeometry args={[L.design.w, L.design.h]} />
      <meshBasicMaterial
        ref={maskMat}
        color="#000000"
        transparent
        opacity={1}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
