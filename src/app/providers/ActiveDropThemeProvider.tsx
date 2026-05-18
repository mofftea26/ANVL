import { useEffect, useState, type PropsWithChildren } from 'react'
import { subscribeDropsChange } from '@/features/cms/read/cmsSubscriptions'
import {
  ACTIVE_DROP_THEME_STYLE_ID,
  serializeDropPaletteForRootStyle,
} from '@/features/cms/theme/dropPaletteStyle'
import { runtimeClients } from '@/app/config/runtime'
import type { Drop } from '@/features/drops/drop.types'

type Props = PropsWithChildren<{
  initialDrop: Drop | null
}>

/**
 * Owns the public `:root` palette `<style>` for the active drop and keeps it
 * in sync when local CMS drop storage changes (no reliance on parent loader re-runs).
 */
export function ActiveDropThemeProvider({ initialDrop, children }: Props) {
  const [drop, setDrop] = useState<Drop | null>(initialDrop)

  useEffect(() => {
    setDrop(initialDrop)
  }, [initialDrop])

  useEffect(() => {
    return subscribeDropsChange(() => {
      void runtimeClients.cms.getActiveDrop().then(setDrop)
    })
  }, [])

  const themeCss =
    drop?.theme != null ? serializeDropPaletteForRootStyle(drop.theme) : null

  return (
    <>
      {themeCss ? (
        <style
          id={ACTIVE_DROP_THEME_STYLE_ID}
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      ) : null}
      {children}
    </>
  )
}
