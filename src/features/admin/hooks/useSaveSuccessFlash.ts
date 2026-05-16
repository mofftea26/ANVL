import { useCallback, useEffect, useState } from 'react'

/** Brief “saved” UI state after a successful save (client-only timer). */
export function useSaveSuccessFlash(durationMs = 2200) {
  const [show, setShow] = useState(false)
  const flashSuccess = useCallback(() => {
    setShow(true)
  }, [])

  useEffect(() => {
    if (!show) return
    const id = window.setTimeout(() => setShow(false), durationMs)
    return () => window.clearTimeout(id)
  }, [show, durationMs])

  return { showSuccess: show, flashSuccess }
}
