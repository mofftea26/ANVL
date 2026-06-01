import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'
import { isBrowser } from '@/shared/lib/storage/isBrowser'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'

export const DROPS_STORAGE_KEY = 'ANVL_DROPS'
export const ACTIVE_DROP_ID_STORAGE_KEY = 'ANVL_ACTIVE_DROP_ID'
export const REMOTE_DROP_DELETE_QUEUE_KEY = ADMIN_STORAGE_KEYS.remoteDropDeleteQueue

export const DROPS_CHANGE_EVENT = 'anvl:drops:change'

const dropsChannel = createLocalStorageChannel({
  key: DROPS_STORAGE_KEY,
  changeEvent: DROPS_CHANGE_EVENT,
  alsoListenForKeys: [ACTIVE_DROP_ID_STORAGE_KEY, REMOTE_DROP_DELETE_QUEUE_KEY],
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

export function readRemoteDropDeleteQueue(): string[] {
  if (!isBrowser()) return []
  try {
    const raw = dropsChannel.readKey(REMOTE_DROP_DELETE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  } catch {
    return []
  }
}

export function queueRemoteDropDelete(clientDropId: string): void {
  if (!isBrowser()) return
  const id = clientDropId.trim()
  if (!id) return
  const queue = readRemoteDropDeleteQueue()
  if (queue.includes(id)) return
  dropsChannel.writeKey(REMOTE_DROP_DELETE_QUEUE_KEY, JSON.stringify([...queue, id]))
}

export function removeRemoteDropDeleteQueueIds(clientDropIds: string[]): void {
  if (!isBrowser()) return
  if (clientDropIds.length === 0) return
  const remove = new Set(clientDropIds)
  const next = readRemoteDropDeleteQueue().filter((id) => !remove.has(id))
  dropsChannel.writeKey(REMOTE_DROP_DELETE_QUEUE_KEY, JSON.stringify(next))
}
