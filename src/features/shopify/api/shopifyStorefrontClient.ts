import type { ShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'

export type ShopifyStorefrontGraphqlResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

export async function shopifyStorefrontRequest<T>(
  env: ShopifyPublicEnv,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = `https://${env.storeDomain}/api/${env.storefrontApiVersion}/graphql.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': env.storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Shopify Storefront API HTTP ${res.status}`)
  }

  const json = (await res.json()) as ShopifyStorefrontGraphqlResponse<T>
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  if (!json.data) {
    throw new Error('Shopify Storefront API returned no data')
  }
  return json.data
}

export const SHOPIFY_PRODUCTS_LIST_QUERY = `
  query AnvlProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          tags
          createdAt
          featuredImage {
            url
            altText
          }
          images(first: 12) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          metafield(namespace: "anvl", key: "drop_ids") {
            value
          }
        }
      }
    }
  }
`

export const SHOPIFY_PRODUCT_BY_HANDLE_QUERY = `
  query AnvlProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      productType
      tags
      createdAt
      featuredImage {
        url
        altText
      }
      images(first: 20) {
        edges {
          node {
            url
            altText
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      metafield(namespace: "anvl", key: "drop_ids") {
        value
      }
    }
  }
`
