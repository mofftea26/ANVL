import { Link } from '@tanstack/react-router'
import { AnvlLogoImage } from '@/shared/components/brand/AnvlLogoImage'
import { Container } from '@/shared/components/ui/Container'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-[var(--color-line)] py-12">
      <Container className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <AnvlLogoImage
            variant="stacked"
            className="h-14 w-auto max-w-[min(100%,280px)] md:h-16"
          />
          <p className="mt-3 max-w-sm text-sm text-[var(--color-text-muted)]">
            Premium bodybuilding gymwear for serious lifters.
          </p>
          <p className="anvl-micro mt-4">Forged Under Pressure</p>
        </div>
        <nav className="space-y-2 text-sm">
          <Link to="/shop">Shop</Link>
          <br />
          <Link to="/about">About</Link>
          <br />
          <Link to="/size-guide">Size Guide</Link>
          <br />
          <Link to="/returns">Returns</Link>
        </nav>
        <div>
          <p className="anvl-micro mb-3">Newsletter</p>
          <div className="flex gap-2">
            <Input aria-label="Email for newsletter" placeholder="Email address" />
            <Button type="button">Join</Button>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Instagram / TikTok placeholders</p>
        </div>
      </Container>
      <Container className="mt-8 border-t border-[var(--color-line)] pt-6 text-xs text-[var(--color-text-muted)]">
        <p>© {year} ANVL Athletics. All rights reserved.</p>
      </Container>
    </footer>
  )
}
