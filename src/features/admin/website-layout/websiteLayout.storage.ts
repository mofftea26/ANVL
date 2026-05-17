import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'
import { isBrowser } from '@/shared/lib/storage/isBrowser'

export const WEBSITE_LAYOUT_STORAGE_KEY = 'ANVL_WEBSITE_LAYOUT'

export const WEBSITE_LAYOUT_CHANGE_EVENT = 'anvl:websiteLayout:change'

const websiteLayoutChannel = createLocalStorageChannel({
  key: WEBSITE_LAYOUT_STORAGE_KEY,
  changeEvent: WEBSITE_LAYOUT_CHANGE_EVENT,
})

export { isBrowser }

export function readWebsiteLayoutRaw(): string | null {
  return websiteLayoutChannel.read()
}

export function writeWebsiteLayoutRaw(json: string): void {
  websiteLayoutChannel.write(json)
}

export function subscribeWebsiteLayoutChange(listener: () => void): () => void {
  return websiteLayoutChannel.subscribe(listener)
}
