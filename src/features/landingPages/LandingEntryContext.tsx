import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react'

export const LANDING_ENTRY_ATTR = 'data-landing-entry'

type LandingEntryContextValue = {
  homeEntryComplete: boolean
  completeHomeEntry: () => void
  resetHomeEntry: () => void
}

const LandingEntryContext = createContext<LandingEntryContextValue>({
  homeEntryComplete: false,
  completeHomeEntry: () => {},
  resetHomeEntry: () => {},
})

/**
 * Inline in `<head>` — sets the scroll-lock attribute before React hydrates on `/`.
 * Overflow is handled in CSS (`styles.css`) so we never mutate inline styles here
 * (inline styles caused hydration mismatches on `<html>` / `<body>`).
 */
export const LANDING_ENTRY_LOCK_SCRIPT = `(function(){try{var p=location.pathname;if(p!=='/'&&p!=='')return;document.documentElement.setAttribute('${LANDING_ENTRY_ATTR}','active');}catch(e){}})();`

export function applyLandingEntryLock(): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(LANDING_ENTRY_ATTR, 'active')
}

export function releaseLandingEntryLock(): void {
  if (typeof document === 'undefined') return
  document.documentElement.removeAttribute(LANDING_ENTRY_ATTR)
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
}

export function LandingEntryProvider({ children }: PropsWithChildren) {
  const [homeEntryComplete, setHomeEntryComplete] = useState(false)

  const completeHomeEntry = useCallback(() => {
    setHomeEntryComplete(true)
    releaseLandingEntryLock()
  }, [])

  const resetHomeEntry = useCallback(() => {
    setHomeEntryComplete(false)
    applyLandingEntryLock()
  }, [])

  return (
    <LandingEntryContext.Provider
      value={{ homeEntryComplete, completeHomeEntry, resetHomeEntry }}
    >
      {children}
    </LandingEntryContext.Provider>
  )
}

export function useLandingEntry() {
  return useContext(LandingEntryContext)
}
