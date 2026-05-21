import { createContext, useContext } from 'react'
import { LAYOUTS } from './layouts.js'

// Provides the active breakpoint + its layout to every scene component.
// The provider must live INSIDE <Canvas> (R3F has its own reconciler, so
// React context does not cross the Canvas boundary).
export const BreakpointContext = createContext({
  bp: 'desktop',
  layout: LAYOUTS.desktop,
})

export const useLayout = () => useContext(BreakpointContext).layout
export const useBp = () => useContext(BreakpointContext).bp
