import { useEffect, useState } from 'react'

export type AboutViewMode = 'altar' | 'normal'

const STORAGE_KEY = 'anvl.about.viewMode.v1'

function readStored(): AboutViewMode | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'altar' || raw === 'normal' ? raw : null
  } catch {
    return null
  }
}

/**
 * The reader's altar/normal preference for the About page — remembered across
 * visits in this browser, but only ever honoured when the device is actually
 * altar-capable (`capable`). An incapable device (mobile, reduced motion,
 * no WebGL) always gets the normal page regardless of a stale stored value.
 */
export function useAboutViewMode(
  capable: boolean,
): [AboutViewMode, (mode: AboutViewMode) => void] {
  const [mode, setMode] = useState<AboutViewMode>('normal')

  useEffect(() => {
    if (!capable) {
      setMode('normal')
      return
    }
    setMode(readStored() ?? 'altar')
  }, [capable])

  function update(next: AboutViewMode) {
    setMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore — the toggle still works for this page view */
    }
  }

  return [mode, update]
}
