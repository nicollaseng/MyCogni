import { unstable_isUnrecognizedActionError } from 'next/navigation'

const listeners = new Set<() => void>()

let outdated = false

export function reportOutdatedApp(): void {
  outdated = true
  for (const listener of listeners) {
    listener()
  }
}

export function isAppOutdated(): boolean {
  return outdated
}

export function subscribeToOutdatedApp(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function unlessOutdated<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work()
  } catch (cause) {
    if (!unstable_isUnrecognizedActionError(cause)) {
      throw cause
    }
    reportOutdatedApp()
    return null
  }
}
