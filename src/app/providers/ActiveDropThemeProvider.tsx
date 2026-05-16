import { useEffect, useState, type PropsWithChildren } from 'react'
import { runtimeClients } from '@/app/config/runtime'
import { subscribeDropsChange } from '@/features/admin/drops/drops.storage'
import type { Drop } from '@/features/admin/drops/drops.types'
import { syncActiveDropThemeStyleTag } from '@/features/admin/drops/dropPaletteStyle'

type Props = PropsWithChildren<{
  initialDrop: Drop | null
}>

export function ActiveDropThemeProvider({
  initialDrop,
  children,
}: Props) {
  const [drop, setDrop] = useState<Drop | null>(initialDrop)

  useEffect(() => {
    setDrop(initialDrop)
  }, [initialDrop])

  useEffect(() => {
    syncActiveDropThemeStyleTag(drop?.theme ?? null)
  }, [drop])

  useEffect(() => {
    return () => {
      syncActiveDropThemeStyleTag(null)
    }
  }, [])

  useEffect(() => {
    return subscribeDropsChange(() => {
      void runtimeClients.cms.getActiveDrop().then(setDrop)
    })
  }, [])

  return <>{children}</>
}
