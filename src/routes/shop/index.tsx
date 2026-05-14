import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { Container, ProductCard, Section } from '@/shared/components/ui'

export const Route = createFileRoute('/shop/')({
  loader: async () => {
    const [products, shopSeo] = await Promise.all([
      runtimeClients.commerce.getProducts(),
      runtimeClients.seo.getSeoByPath('/shop'),
    ])
    return { products, shopSeo }
  },
  head: ({ loaderData }) => {
    const seo = loaderData?.shopSeo
    if (seo) {
      return buildSeoMeta({
        title: seo.title,
        description: seo.description,
        path: seo.canonicalPath,
        image: seo.ogImage,
      })
    }
    return buildSeoMeta({
      title: 'Shop | ANVL Athletics',
      description: 'Shop Drop 01: The Oath by ANVL Athletics.',
      path: '/shop',
    })
  },
  component: ShopPage,
})

function ShopPage() {
  const { products } = Route.useLoaderData()
  return (
    <Section>
      <Container>
        <h1 className="anvl-heading text-6xl">Shop</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Drop 01: The Oath
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
