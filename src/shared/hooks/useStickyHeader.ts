import { useEffect, useState } from 'react'

export function useStickyHeader() {
  const [isSolid, setIsSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return isSolid
}
