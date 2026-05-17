import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'
import { isBrowser } from '@/shared/lib/storage/isBrowser'

export const GLOBAL_BRAND_STORAGE_KEY = 'ANVL_GLOBAL_BRAND'

export const GLOBAL_BRAND_CHANGE_EVENT = 'anvl:global-brand:change'

const globalBrandChannel = createLocalStorageChannel({
  key: GLOBAL_BRAND_STORAGE_KEY,
  changeEvent: GLOBAL_BRAND_CHANGE_EVENT,
})

export { isBrowser }

export function readGlobalBrandRaw(): string | null {
  return globalBrandChannel.read()
}

export function writeGlobalBrandRaw(json: string): void {
  globalBrandChannel.write(json)
}

export function subscribeGlobalBrandChange(listener: () => void): () => void {
  return globalBrandChannel.subscribe(listener)
}
