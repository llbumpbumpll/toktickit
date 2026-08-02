export type StoredRequester = { id: number; name: string; email: string }

const STORAGE_KEY = 'tokTickIt:requester'

/** BR-27: the selected Development Requester identity is stored client-side in sessionStorage. */
export function getStoredRequester(): StoredRequester | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredRequester
  } catch {
    return null
  }
}

export function setStoredRequester(requester: StoredRequester): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requester))
}

export function clearStoredRequester(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
