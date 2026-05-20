import { Link } from '@tanstack/react-router'
import { ExternalLink, MoreVertical } from 'lucide-react'
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
  onArchive: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function DropRowOverflowMenu({
  row,
  busy,
  className,
  triggerClassName,
  onActivate,
  onSchedule,
  onArchive,
  onDelete,
  onDuplicate,
}: DropRowOverflowMenuProps) {
  const canActivate = !row.isActive && row.status !== 'archived'
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
        <AdminDropdownMenuItem asChild>
          <a
            href={`/drop/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className={cn(menuItemLinkClass, 'inline-flex items-center')}
          >
            Preview storefront
            <ExternalLink className="ml-auto size-3.5 opacity-70" aria-hidden />
          </a>
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
        {row.status !== 'archived' ? (
          <AdminDropdownMenuItem disabled={busy} onSelect={() => onSchedule()}>
            Schedule activation
          </AdminDropdownMenuItem>
        ) : null}
        {row.status !== 'archived' ? (
          <AdminDropdownMenuItem disabled={busy} onSelect={() => onArchive()}>
            Archive
          </AdminDropdownMenuItem>
        ) : null}
        <AdminDropdownMenuSeparator />
        <AdminDropdownMenuItem destructive disabled={busy} onSelect={() => onDelete()}>
          Delete…
        </AdminDropdownMenuItem>
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  )
}
