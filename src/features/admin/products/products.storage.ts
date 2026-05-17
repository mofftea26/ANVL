import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'
import { isBrowser } from '@/shared/lib/storage/isBrowser'

export const PRODUCTS_STORAGE_KEY = 'ANVL_PRODUCTS'

export const PRODUCTS_CHANGE_EVENT = 'anvl:products:change'

const productsChannel = createLocalStorageChannel({
  key: PRODUCTS_STORAGE_KEY,
  changeEvent: PRODUCTS_CHANGE_EVENT,
})

export { isBrowser }

export function readProductsRaw(): string | null {
  return productsChannel.read()
}

export function writeProductsRaw(json: string): void {
  productsChannel.write(json)
}

export function subscribeProductsChange(listener: () => void): () => void {
  return productsChannel.subscribe(listener)
}
