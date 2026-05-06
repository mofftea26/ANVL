import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import type { Product } from '@/features/products/types/product.types'
import { Container } from '@/shared/components/ui/Container'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'

export function DropRevealSection({ products }: { products: Product[] }) {
  const reduced = useReducedMotion()

  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)] py-14">
      <Container>
        <h2 className="anvl-heading text-5xl md:text-7xl">DROP 01: THE OATH</h2>
        <p className="anvl-micro mt-2">Fullscreen editorial sequence, optimized for mobile and SSR.</p>
        <div className="mt-8 space-y-6">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={reduced ? undefined : { opacity: 0, y: 30 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ amount: 0.35, once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="grid gap-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5 md:grid-cols-[180px_1fr_220px]"
            >
              <div className="anvl-heading text-4xl">
                {String(index + 1).padStart(2, '0')}
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                  / {String(products.length).padStart(2, '0')}
                </span>
              </div>
              <div>
                <h3 className="anvl-heading text-4xl">{product.name}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{product.fabric}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{product.gsm}</p>
              </div>
              <Link
                to="/shop/$slug"
                params={{ slug: product.slug }}
                className="anvl-micro inline-flex items-center justify-start no-underline underline-offset-4 hover:underline md:justify-end"
              >
                View Product
              </Link>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  )
}
