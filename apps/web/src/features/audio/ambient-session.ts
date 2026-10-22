import type { AmbientSoundId } from '@mycogni/domain'

export interface AmbientSnapshot {
  pathname: string
  running: boolean
  previewing: AmbientSoundId | null
  ducks: number
  holds: number
}

export interface AmbientSession {
  initial: () => AmbientSnapshot
  snapshot: () => AmbientSnapshot
  subscribe: (listener: () => void) => () => void
  update: (change: Partial<AmbientSnapshot>) => void
}

export function createAmbientSession(pathname: string): AmbientSession {
  const initial: AmbientSnapshot = {
    pathname,
    running: false,
    previewing: null,
    ducks: 0,
    holds: 0,
  }
  let state = initial
  const listeners = new Set<() => void>()

  return {
    initial: () => initial,
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
