import { Link } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuSeparator,
  AdminDropdownMenuTrigger,
} from '@/features/admin/components/AdminDropdownMenu'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { cn } from '@/shared/lib/cn'

const menuItemLinkClass =
  'cursor-pointer gap-2 no-underline hover:bg-[var(--color-chip)] focus:bg-[var(--color-chip)]'

export type DropRowOverflowMenuProps = {
  row: AdminDropListItem
  busy: boolean
  className?: string
  triggerClassName?: string
  onActivate: () => void
  onSchedule: () => void
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
}

export function DropRowOverflowMenu({
  row,
  busy,
  className,
  triggerClassName,
  onActivate,
  onSchedule,
  onDelete,
  onDuplicate,
  onPreview,
}: DropRowOverflowMenuProps) {
  const canActivate = !row.isActive
  const menuLabel = `Actions for ${row.title}`

  return (
    <AdminDropdownMenu>
      <AdminDropdownMenuTrigger asChild>
        <AdminButton
          type="button"
          variant="ghost"
          size="compact"
          disabled={busy}
          aria-haspopup="menu"
          aria-label={menuLabel}
          title={menuLabel}
          className={cn('shrink-0', triggerClassName, className)}
        >
          <MoreVertical className="size-[18px]" aria-hidden />
        </AdminButton>
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent align="end" className="min-w-[12rem]">
        <AdminDropdownMenuItem asChild>
          <Link
            to="/admin/drops/$dropId"
            params={{ dropId: row.id }}
            className={cn(menuItemLinkClass)}
          >
            Edit
          </Link>
        </AdminDropdownMenuItem>
        <AdminDropdownMenuItem disabled={busy} onSelect={() => onPreview()}>
          Preview storefront
        </AdminDropdownMenuItem>
        <AdminDropdownMenuSeparator />
        <AdminDropdownMenuItem disabled={busy} onSelect={() => onDuplicate()}>
          Duplicate
        </AdminDropdownMenuItem>
        {canActivate ? (
          <AdminDropdownMenuItem disabled={busy} onSelect={() => onActivate()}>
            Set active
          </AdminDropdownMenuItem>
        ) : null}
        <AdminDropdownMenuItem disabled={busy} onSelect={() => onSchedule()}>
          Schedule activation
        </AdminDropdownMenuItem>
        <AdminDropdownMenuSeparator />
        <AdminDropdownMenuItem destructive disabled={busy} onSelect={() => onDelete()}>
          Delete…
        </AdminDropdownMenuItem>
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  )
}
