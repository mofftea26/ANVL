import { useCallback, useEffect, useRef, useState } from 'react'

const FLASH_MS = 2000

/** Brief “Saved” affordance for admin editors without blocking further saves. */
export function useSaveSuccessFlash() {
  const [showSuccess, setShowSuccess] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashSuccess = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShowSuccess(true)
    timeoutRef.current = setTimeout(() => {
      setShowSuccess(false)
      timeoutRef.current = null
    }, FLASH_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { showSuccess, flashSuccess }
}
