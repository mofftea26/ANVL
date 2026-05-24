import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'

export const SITE_HOME_EXTRAS_STORAGE_KEY = 'ANVL_SITE_HOME_EXTRAS'

export const SITE_HOME_EXTRAS_CHANGE_EVENT = 'anvl:siteHomeExtras:change'

const siteHomeExtrasChannel = createLocalStorageChannel({
  key: SITE_HOME_EXTRAS_STORAGE_KEY,
  changeEvent: SITE_HOME_EXTRAS_CHANGE_EVENT,
})

export function readSiteHomeExtrasRaw(): string | null {
  return siteHomeExtrasChannel.read()
}

export function writeSiteHomeExtrasRaw(json: string): void {
  siteHomeExtrasChannel.write(json)
}

export function subscribeSiteHomeExtrasChange(listener: () => void): () => void {
  return siteHomeExtrasChannel.subscribe(listener)
}
