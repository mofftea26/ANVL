import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { ADMIN_GAMIFICATION_RULES_QUERY_KEY } from '@/features/admin/gamification/AdminGamificationPage'
import { loadGamificationRules } from '@/features/admin/gamification/gamification.service'
import {
  searchAdminProfiles,
  type AdminProfileSearchHit,
} from '@/features/admin/api/searchAdminProfiles'
import { deriveArmoryRank } from '@/features/passport/lib/ranks'
import type { GamificationRules } from '@/features/passport/schemas/gamification.schema'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { cn } from '@/shared/lib/cn'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

/**
 * Approximate the athlete's rank from the search hit. The RPC only exposes
 * `claim_count` — drop completion is unknown here, so we pass an EMPTY
 * completion (rank derives from claims alone). Warlord-tier levels gated on
 * full drops therefore never match from this surface; the written rank is a
 * historical SNAPSHOT either way (it does not live-update with the athlete).
 */
function deriveSnapshotRank(claimCount: number, rules: GamificationRules | undefined): string {
  return deriveArmoryRank(claimCount, [], rules).title
}

export interface CastProfileSnapshot {
  name: string
  rank: string
  /** Linked athlete profile id. */
  userId: string
  /** Profile picture URL ('' when none). */
  avatarUrl: string
  /**
   * Minted armory handle IFF the armory is public — the storefront links the
   * mention to /armory/<handle> only when this is set.
   */
  armoryHandle: string | null
}

interface CastProfileNameFieldProps {
  name: string
  /** Free-text typing (also re-enters free-text mode). */
  onNameChange: (name: string) => void
  /** A profile was picked — snapshot of name + derived rank title. */
  onProfileSelect: (snapshot: CastProfileSnapshot) => void
  disabled?: boolean
}

/**
 * The cast member's name field as a searchable combobox over real customer
 * profiles (`admin_search_profiles` RPC): type ≥2 characters to search
 * (debounced), arrow keys + Enter to pick, Escape to dismiss. Picking a
 * profile snapshots the display name and DERIVES the athlete's rank title
 * from the gamification rules ({@link deriveSnapshotRank}).
 *
 * Free text remains a first-class path — cast members may be fictional lore
 * characters — so plain typing always works and an explicit "Use as free
 * text" option keeps whatever was typed without a profile link.
 */
export function CastProfileNameField({
  name,
  onNameChange,
  onProfileSelect,
  disabled,
}: CastProfileNameFieldProps) {
  const inputId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<AdminProfileSearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // Suppress the search that would fire from programmatic value changes
  // (profile pick / free-text confirm).
  const suppressSearchRef = useRef(false)

  const rulesQuery = useQuery({
    queryKey: ADMIN_GAMIFICATION_RULES_QUERY_KEY,
    queryFn: loadGamificationRules,
  })
  const rules = rulesQuery.data

  // Debounced profile search on the typed name.
  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false
      return
    }
    const query = name.trim()
    if (query.length < MIN_QUERY_LENGTH) {
      setHits([])
      setSearchError(null)
      setOpen(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      setOpen(true)
      void searchAdminProfiles(query).then((res) => {
        if (cancelled) return
        setSearching(false)
        if (!res.ok) {
          setSearchError(res.error)
          setHits([])
        } else {
          setSearchError(null)
          setHits(res.hits)
        }
        setActiveIndex(0)
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
      setSearching(false)
    }
  }, [name])

  // Click-away closes the listbox.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const options = useMemo(() => hits.slice(0, 8), [hits])
  // The trailing "Use as free text" row is part of the keyboard order.
  const optionCount = options.length + 1

  const pick = (hit: AdminProfileSearchHit) => {
    suppressSearchRef.current = true
    setOpen(false)
    onProfileSelect({
      name: hit.fullName || (hit.armoryHandle ? `@${hit.armoryHandle}` : 'Athlete'),
      rank: deriveSnapshotRank(hit.claimCount, rules),
      userId: hit.userId,
      avatarUrl: hit.avatarUrl,
      // Only a public, minted handle becomes a live guest-armory link.
      armoryHandle: hit.armoryPublic && hit.armoryHandle ? hit.armoryHandle : null,
    })
  }

  const keepFreeText = () => {
    suppressSearchRef.current = true
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, optionCount - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const hit = options[activeIndex]
      if (hit) pick(hit)
      else keepFreeText()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <FormField
      label="Name"
      htmlFor={inputId}
      hint="Type to search real athletes, or keep free text for lore characters."
      labelStyle="stacked"
    >
      <div ref={rootRef} className="relative">
        <Input
          id={inputId}
          density="compact"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open ? `${listboxId}-opt-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (name.trim().length >= MIN_QUERY_LENGTH && (options.length > 0 || searchError)) {
              setOpen(true)
            }
          }}
        />
        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Matching athletes"
            className="absolute inset-x-0 top-full z-[100] mt-1 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] py-1 shadow-[0_16px_44px_-12px_rgba(0,0,0,0.8)]"
          >
            {searching ? (
              <li className="px-3 py-2 text-xs text-[var(--color-text-muted)]" aria-hidden="true">
                Searching athletes…
              </li>
            ) : searchError ? (
              <li className="px-3 py-2 text-xs text-[var(--color-danger,#c0564a)]" aria-hidden="true">
                {searchError}
              </li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[var(--color-text-muted)]" aria-hidden="true">
                No matching athletes.
              </li>
            ) : (
              options.map((hit, i) => (
                <li
                  key={hit.userId}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    pick(hit)
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'cursor-pointer px-3 py-2',
                    i === activeIndex && 'bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)]',
                  )}
                >
                  <p className="text-sm text-[var(--color-text)]">
                    {hit.fullName || '(no name)'}
                    {hit.armoryHandle ? (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                        @{hit.armoryHandle}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {hit.claimCount} piece{hit.claimCount === 1 ? '' : 's'} registered ·{' '}
                    {deriveSnapshotRank(hit.claimCount, rules)}
                  </p>
                </li>
              ))
            )}
            <li
              id={`${listboxId}-opt-${options.length}`}
              role="option"
              aria-selected={activeIndex === options.length}
              onPointerDown={(e) => {
                e.preventDefault()
                keepFreeText()
              }}
              onMouseEnter={() => setActiveIndex(options.length)}
              className={cn(
                'cursor-pointer border-t border-[var(--color-line)]/60 px-3 py-2 text-xs text-[var(--color-text-muted)]',
                activeIndex === options.length &&
                  'bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[var(--color-text)]',
              )}
            >
              Use “{name.trim()}” as free text (no profile link)
            </li>
          </ul>
        ) : null}
      </div>
    </FormField>
  )
}
