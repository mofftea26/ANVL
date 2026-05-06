import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
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
        <h1 className="anvl-heading text-7xl">Drop 01: The Oath</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Forged Under Pressure. A compact launch built for serious lifters and premium training silhouettes.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
