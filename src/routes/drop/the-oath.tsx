import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { AnvlOathShape } from '@/shared/assets/brand'
import { Container, ProductCard, Section } from '@/shared/components/ui'

export const Route = createFileRoute('/drop/the-oath')({
  loader: async () => runtimeClients.commerce.getProducts(),
  head: () =>
    buildSeoMeta({
      title: 'Drop 01: The Oath | ANVL Athletics',
      description: 'First ANVL launch drop featuring the Oversized Tee, Stringer, and Compression Tee.',
      path: '/drop/the-oath',
    }),
  component: TheOathPage,
})

function TheOathPage() {
  const products = Route.useLoaderData()
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="anvl-micro text-[var(--color-text-muted)]">Drop 01</p>
            <h1 className="anvl-heading mt-2 text-7xl md:text-8xl">The Oath</h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--color-text-muted)] md:text-base">
              Forged Under Pressure. A compact launch built for serious lifters and premium training silhouettes.
            </p>
          </div>
          <AnvlOathShape
            className="mx-auto h-64 w-auto text-[var(--color-heading)] opacity-90 md:h-80 lg:h-96"
          />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
