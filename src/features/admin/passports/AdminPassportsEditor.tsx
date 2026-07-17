import { useState } from 'react'
import { BookOpenText, QrCode } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { AdminPassportCodesPanel } from './AdminPassportCodesPanel'
import { AdminPassportContentEditor } from './AdminPassportContentEditor'

type PassportTab = 'codes' | 'content'

const TABS: Array<{ key: PassportTab; label: string; icon: typeof QrCode }> = [
  { key: 'codes', label: 'QR codes', icon: QrCode },
  { key: 'content', label: 'Passport content', icon: BookOpenText },
]

/**
 * /admin/passports — two surfaces behind tabs:
 *  - QR codes: per-unit code generation, claim ledger, print sheets
 *  - Passport content: per-product editorial sections (multi-step wizard)
 */
export function AdminPassportsEditor() {
  const [tab, setTab] = useState<PassportTab>('codes')

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Passport surfaces"
        className="inline-flex gap-1 rounded-full border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)] p-1"
      >
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                'focus-ring flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors',
                active
                  ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              <t.icon size={13} aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'codes' ? <AdminPassportCodesPanel /> : <AdminPassportContentEditor />}
    </div>
  )
}
