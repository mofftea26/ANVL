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

/** Inline in `<head>` / `<body>` — locks scroll before React hydrates on `/`. */
export const LANDING_ENTRY_LOCK_SCRIPT = `(function(){try{var p=location.pathname;if(p!=='/'&&p!=='')return;var d=document.documentElement;d.setAttribute('${LANDING_ENTRY_ATTR}','active');d.style.overflow='hidden';d.style.height='100%';var b=document.body;if(b){b.style.overflow='hidden';b.style.height='100%';}}catch(e){}})();`

export function applyLandingEntryLock(): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(LANDING_ENTRY_ATTR, 'active')
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.height = '100%'
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'
}

export function releaseLandingEntryLock(): void {
  if (typeof document === 'undefined') return
  document.documentElement.removeAttribute(LANDING_ENTRY_ATTR)
  document.documentElement.style.overflow = ''
  document.documentElement.style.height = ''
  document.body.style.overflow = ''
  document.body.style.height = ''
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
