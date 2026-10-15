export const ambientSoundIds = ['sea', 'rain', 'forest', 'brown-noise', 'none'] as const

export type AmbientSoundId = (typeof ambientSoundIds)[number]

export type AmbientLoopId = Exclude<AmbientSoundId, 'none'>

export const defaultAmbientSound: AmbientSoundId = 'sea'

export const ambientScopes = ['zen', 'app', 'off'] as const

export type AmbientScope = (typeof ambientScopes)[number]

export const defaultAmbientScope: AmbientScope = 'zen'

export const defaultAmbientVolume = 0.12

export const duckedAmbientShare = 0.3

export const ambientLoopFiles: Readonly<Record<AmbientLoopId, string>> = {
  sea: 'sea.m4a',
  rain: 'rain.m4a',
  forest: 'forest.m4a',
  'brown-noise': 'brown-noise.m4a',
}

export function isAmbientSoundId(value: unknown): value is AmbientSoundId {
  return ambientSoundIds.some((id) => id === value)
}

export function isAmbientScope(value: unknown): value is AmbientScope {
  return ambientScopes.some((scope) => scope === value)
}

export function ambientVolumeOf(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultAmbientVolume
  }
  return Math.min(Math.max(value, 0), 1)
}

export interface AmbientPlacement {
  scope: AmbientScope
  sound: AmbientSoundId
  onZen: boolean
}

export function ambientLoopAt({ scope, sound, onZen }: AmbientPlacement): AmbientLoopId | null {
  if (sound === 'none' || scope === 'off' || (scope === 'zen' && !onZen)) {
    return null
  }
  return sound
}
