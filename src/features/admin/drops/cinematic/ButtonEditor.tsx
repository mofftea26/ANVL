import { AdminFieldLabel } from '@/features/admin/components/AdminFieldLabel'
import { AdminInput } from '@/features/admin/components/AdminInput'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import type { CinematicHeroButton } from '@/features/marketing/cinematic-hero/cinematicHero.types'

type ButtonEditorProps = {
  value: CinematicHeroButton
  onChange: (next: CinematicHeroButton) => void
  onRemove?: () => void
}

export function ButtonEditor({ value, onChange, onRemove }: ButtonEditorProps) {
  return (
    <div className="grid gap-2 rounded-md border border-[var(--color-line)]/50 p-3 md:grid-cols-2">
      <AdminFieldLabel labelStyle="stacked" className="block">
        Label
        <AdminInput
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </AdminFieldLabel>
      <AdminFieldLabel labelStyle="stacked" className="block">
        Href
        <AdminInput
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="/shop"
        />
      </AdminFieldLabel>
      <AdminFieldLabel labelStyle="stacked" className="block">
        Variant
        <AdminSelect
          value={value.variant}
          onValueChange={(v) =>
            onChange({ ...value, variant: v as CinematicHeroButton['variant'] })
          }
        >
          <AdminSelectTrigger className="mt-1">
            <AdminSelectValue />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value="primary">Primary</AdminSelectItem>
            <AdminSelectItem value="secondary">Secondary</AdminSelectItem>
            <AdminSelectItem value="outline">Outline</AdminSelectItem>
            <AdminSelectItem value="ghost">Ghost</AdminSelectItem>
          </AdminSelectContent>
        </AdminSelect>
      </AdminFieldLabel>
      {onRemove ? (
        <div className="flex items-end">
          <button
            type="button"
            className="text-xs text-[var(--color-text-muted)] underline"
            onClick={onRemove}
          >
            Remove button
          </button>
        </div>
      ) : null}
    </div>
  )
}
