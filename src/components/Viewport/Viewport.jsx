import s from './Viewport.module.css'

// Full-bleed CRT housing: the WebGL screen fills the viewport with a thin
// bezel of padding around it. The convex barrel + scanlines + aberration
// are done in WebGL by the CRT post-process pass.
export default function Viewport({ children }) {
  return (
    <div className={s.viewport}>
      <div className={s.screen}>{children}</div>
    </div>
  )
}
