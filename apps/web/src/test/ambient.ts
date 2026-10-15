import { jest } from '@jest/globals'
import type { AmbientEngine } from '@/features/audio/ambient-engine'

export function fakeEngine() {
  return {
    unlock: jest.fn<AmbientEngine['unlock']>(),
    play: jest.fn<AmbientEngine['play']>(),
    stop: jest.fn<AmbientEngine['stop']>(),
    setVolume: jest.fn<AmbientEngine['setVolume']>(),
    setDucked: jest.fn<AmbientEngine['setDucked']>(),
  } satisfies AmbientEngine
}
