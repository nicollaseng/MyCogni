export const ambientSoundIds = [
  'sea',
  'rain',
  'forest',
  'night-forest',
  'birdsong',
  'meadow',
  'campfire',
  'mountain-wind',
  'snow',
  'owl',
  'brown-noise',
  'none',
] as const

export type AmbientSoundId = (typeof ambientSoundIds)[number]

export type AmbientLoopId = Exclude<AmbientSoundId, 'none'>

export const defaultAmbientSound: AmbientSoundId = 'sea'

export const ambientScopes = ['zen', 'app', 'off'] as const

export type AmbientScope = (typeof ambientScopes)[number]

export const defaultAmbientScope: AmbientScope = 'zen'

export const defaultAmbientVolume = 0.12

export const duckedAmbientShare = 0.3

export const ambientLoopFiles: Readonly<Record<AmbientLoopId, string>> = {
  sea: 'sea.0cbaba80.m4a',
  rain: 'rain.d794f009.m4a',
  forest: 'forest.dc554ac7.m4a',
  'night-forest': 'night-forest.d095e9de.m4a',
  birdsong: 'birdsong.a8421468.m4a',
  meadow: 'meadow.9bee5e72.m4a',
  campfire: 'campfire.5c54ae99.m4a',
  'mountain-wind': 'mountain-wind.eca431ce.m4a',
  snow: 'snow.2edbbd57.m4a',
  owl: 'owl.dcd211a9.m4a',
  'brown-noise': 'brown-noise.27aa3411.m4a',
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
