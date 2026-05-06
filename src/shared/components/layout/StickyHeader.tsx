import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { AnvlWordmark } from '@/shared/assets/brand'
import { useStickyHeader } from '@/shared/hooks/useStickyHeader'
import { useCart } from '@/features/cart/hooks/useCart'
import { cn } from '@/shared/lib/cn'
import { Container } from '@/shared/components/ui/Container'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Drawer } from '@/shared/components/ui/Drawer'

export function StickyHeader({ navigation }: { navigation: Array<{ label: string; href: string }> }) {
  const isSolid = useStickyHeader()
  const [open, setOpen] = useState(false)
  const { quantity } = useCart()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition',
        isSolid
          ? 'border-[var(--color-line)] bg-[rgba(11,11,12,0.92)] backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-16 items-center gap-3">
        <Link to="/" className="text-[var(--color-heading)]">
          <AnvlWordmark className="h-6 w-auto" />
        </Link>
        <nav className="ml-8 hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link key={item.href} to={item.href} className="anvl-micro text-xs no-underline hover:text-[var(--color-heading)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/cart" className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]">
            <ShoppingBag size={16} />
            <span className="absolute -right-1 -top-1 rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] text-[var(--color-bg)]">
              {quantity}
            </span>
          </Link>
          <IconButton
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open mobile navigation"
          >
            <Menu size={16} />
          </IconButton>
        </div>
      </Container>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <div className="flex items-center justify-between">
          <AnvlWordmark className="h-6 w-auto text-[var(--color-heading)]" />
          <IconButton onClick={() => setOpen(false)} aria-label="Close mobile navigation">
            <X size={16} />
          </IconButton>
        </div>
        <nav className="mt-8 flex flex-col gap-4">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="anvl-heading text-3xl no-underline"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </header>
  )
}
