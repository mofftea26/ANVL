import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'
import { isBrowser } from '@/shared/lib/storage/isBrowser'

export const DROPS_STORAGE_KEY = 'ANVL_DROPS'
export const ACTIVE_DROP_ID_STORAGE_KEY = 'ANVL_ACTIVE_DROP_ID'

export const DROPS_CHANGE_EVENT = 'anvl:drops:change'

const dropsChannel = createLocalStorageChannel({
  key: DROPS_STORAGE_KEY,
  changeEvent: DROPS_CHANGE_EVENT,
  alsoListenForKeys: [ACTIVE_DROP_ID_STORAGE_KEY],
})

export { isBrowser }

export function readDropsRaw(): string | null {
  return dropsChannel.read()
}

export function readActiveDropIdRaw(): string | null {
  return dropsChannel.readKey(ACTIVE_DROP_ID_STORAGE_KEY)
}

export function writeDropsRaw(json: string): void {
  dropsChannel.write(json)
}

export function writeActiveDropId(id: string | null): void {
  dropsChannel.writeKey(ACTIVE_DROP_ID_STORAGE_KEY, id)
}

export function subscribeDropsChange(listener: () => void): () => void {
  return dropsChannel.subscribe(listener)
}
