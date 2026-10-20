import { jest } from '@jest/globals'
import type { AmbientEngine } from '@/features/audio/ambient-engine'

export function fakeEngine({ allowed = true } = {}) {
  let running = false
  let allowStart = allowed
  const listeners = new Set<() => void>()
  return {
    allow() {
      allowStart = true
    },
    unlock: jest.fn<AmbientEngine['unlock']>(() => {
      running = allowStart
      for (const listener of listeners) {
        listener()
      }
      return Promise.resolve(running)
    }),
    running: jest.fn<AmbientEngine['running']>(() => running),
    subscribe: jest.fn<AmbientEngine['subscribe']>((listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }),
    play: jest.fn<AmbientEngine['play']>(),
    stop: jest.fn<AmbientEngine['stop']>(),
    setVolume: jest.fn<AmbientEngine['setVolume']>(),
    setDucked: jest.fn<AmbientEngine['setDucked']>(),
  } satisfies AmbientEngine & { allow: () => void }
}
