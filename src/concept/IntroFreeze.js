import { createContext, useContext } from "react";

/**
 * IntroFreeze — shares the intro's scroll length with the existing <Hero> so the
 * whole experience is ONE continuous, reversible scroll.
 *
 * `introPx` is how many pixels of window scroll the room intro occupies. Hero
 * offsets its own progress by this amount: while you're scrolling through the
 * room (scrollY < introPx) Hero sits at its opening (progress 0); past it, Hero
 * scrolls normally. Scrolling back up naturally rewinds into the room — nothing
 * is latched or one-way.
 *
 * Default `introPx: 0` so a standalone <App /> behaves exactly as before.
 */
export const IntroFreezeContext = createContext({ introPx: 0 });

export function useIntroFreeze() {
  return useContext(IntroFreezeContext);
}
