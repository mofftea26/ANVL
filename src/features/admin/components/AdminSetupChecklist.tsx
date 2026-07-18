import { useSyncExternalStore } from 'react'
import type { LinkProps } from '@tanstack/react-router'
import { Check, Circle } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import {
  readAssetConfigFromStorage,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  readLandingContentFromStorage,
  subscribeLandingContentChange,
} from '@/features/cms/landingContent/landingContent.settings'
import { readActiveLandingPageFromStorage } from '@/features/cms/landingPageActiveKey.settings'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface ChecklistItem {
  key: string
  label: string
  detail: string
  done: boolean
  href: string
}

function useChecklistItems(): ChecklistItem[] {
  const activeKey = useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readActiveLandingPageFromStorage().key,
    () => 'the-oath',
  )
  const dropAssetCount = useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () =>
      Object.values(readAssetConfigFromStorage().drops[activeKey] ?? {}).filter(Boolean).length,
    () => 0,
  )
  const hasLandingContent = useSyncExternalStore(
    subscribeLandingContentChange,
    () => Object.keys(readLandingContentFromStorage()[activeKey] ?? {}).length > 0,
    () => false,
  )

  return [
    {
      key: 'landing',
      label: 'Pick the active drop',
      detail: `Live: ${activeKey}`,
      done: true,
      href: '/admin',
    },
    {
      key: 'assets',
      label: 'Assign the drop media',
      detail:
        dropAssetCount > 0
          ? `${dropAssetCount} slot${dropAssetCount === 1 ? '' : 's'} assigned`
          : 'Slots still on built-in fallbacks',
      done: dropAssetCount > 0,
      href: '/admin/assets',
    },
    {
      key: 'content',
      label: 'Author the landing copy',
      detail: hasLandingContent ? 'Copy overrides saved' : 'Running on designed defaults',
      done: hasLandingContent,
      href: '/admin/content',
    },
    {
      key: 'theme',
      label: 'Tune theme & fonts',
      detail: 'Palette + typefaces restyle the whole storefront',
      done: true,
      href: '/admin/theme',
    },
  ]
}

/**
 * Drop setup checklist — the dashboard's guided path through a new drop
 * (pick page → dress it → write it → style it), with live completion ticks
 * derived from the same local working copies the editors read.
 */
export function AdminSetupChecklist() {
  const items = useChecklistItems()

  return (
    <AdminCard
      title="Drop setup"
      description="The path to a fully dressed drop — each step deep-links to its editor."
    >
      <ol className="divide-y divide-[var(--color-line)]/60">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-3">
            <span
              aria-hidden="true"
              className={
                item.done
                  ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]'
                  : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]'
              }
            >
              {item.done ? (
                <Check size={ICON_SIZE.xs} aria-hidden="true" />
              ) : (
                <Circle size={ICON_SIZE.xs} aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[var(--color-text)]">
                {item.label}
                <span className="sr-only">{item.done ? ' — done' : ' — pending'}</span>
              </span>
              <span className="block truncate text-xs text-[var(--color-text-muted)]">
                {item.detail}
              </span>
            </span>
            <AdminForgedLink to={item.href as LinkProps['to']}>
              <span className="relative z-10">Open</span>
            </AdminForgedLink>
          </li>
        ))}
      </ol>
    </AdminCard>
  )
}
