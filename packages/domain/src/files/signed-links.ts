export const signedLinkWindowSeconds = 60 * 60

export interface SignedLinkWindow {
  expiresAt: number
  expiresIn: number
}

export function signedLinkWindow(
  now: Date,
  windowSeconds: number = signedLinkWindowSeconds,
): SignedLinkWindow {
  const seconds = Math.floor(now.getTime() / 1000)
  const expiresAt = (Math.floor(seconds / windowSeconds) + 2) * windowSeconds
  return { expiresAt, expiresIn: expiresAt - seconds }
}

export interface SignedLinkCache {
  read(key: string, window: SignedLinkWindow): string | undefined
  write(key: string, url: string, window: SignedLinkWindow): void
}

export function createSignedLinkCache(capacity: number): SignedLinkCache {
  const links = new Map<string, { url: string; expiresAt: number }>()
  return {
    read(key, window) {
      const link = links.get(key)
      return link?.expiresAt === window.expiresAt ? link.url : undefined
    },
    write(key, url, window) {
      links.delete(key)
      links.set(key, { url, expiresAt: window.expiresAt })
      for (const oldest of links.keys()) {
        if (links.size <= capacity) {
          break
        }
        links.delete(oldest)
      }
    },
  }
}
