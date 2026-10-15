import type { AmbientSoundId } from '@mycogni/domain'

export interface AmbientSnapshot {
  pathname: string
  wanted: boolean
  previewing: AmbientSoundId | null
  ducks: number
}

export interface AmbientSession {
  snapshot: () => AmbientSnapshot
  subscribe: (listener: () => void) => () => void
  update: (change: Partial<AmbientSnapshot>) => void
}

export function createAmbientSession(pathname: string): AmbientSession {
  let state: AmbientSnapshot = { pathname, wanted: false, previewing: null, ducks: 0 }
  const listeners = new Set<() => void>()

  return {
    snapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update(change) {
      state = { ...state, ...change }
      for (const listener of listeners) {
        listener()
      }
    },
  }
}
