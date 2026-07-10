import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Opts a subtree into the `--shop-*` -> `--color-*` bridge (styles.css
 * `[data-surface="shop"]`), so storefront primitives (Button, Input,
 * IconButton, Skeleton, ...) render themed correctly inside /shop and PDP
 * without any per-primitive `surface` prop.
 */
export function ShopSurfaceScope({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div data-surface="shop" className={cn(className)}>
      {children}
    </div>
  )
}
