export const soundProgrammeIds = ['calm', 'meditate', 'sleep', 'focus', 'lift', 'ease'] as const

export type SoundProgrammeId = (typeof soundProgrammeIds)[number]

export const soundModes = ['binaural', 'isochronic'] as const

export type SoundMode = (typeof soundModes)[number]

export type NoiseBed = 'pink' | 'brown'

export interface SoundProgramme {
  id: SoundProgrammeId
  beat: number
  carrier: number
  bed: NoiseBed
}

export const soundProgrammes: Readonly<Record<SoundProgrammeId, SoundProgramme>> = {
  calm: { id: 'calm', beat: 10, carrier: 200, bed: 'pink' },
  meditate: { id: 'meditate', beat: 6, carrier: 180, bed: 'brown' },
  sleep: { id: 'sleep', beat: 2, carrier: 150, bed: 'brown' },
  focus: { id: 'focus', beat: 18, carrier: 220, bed: 'pink' },
  lift: { id: 'lift', beat: 12, carrier: 210, bed: 'pink' },
  ease: { id: 'ease', beat: 8, carrier: 190, bed: 'brown' },
}

export const soundTimers = [10, 20, 30, null] as const

export type SoundTimer = (typeof soundTimers)[number]

export const defaultSoundTimer: SoundTimer = 20

export const soundFadeInSeconds = 4

export const soundFadeOutSeconds = 10

export function isSoundProgrammeId(value: unknown): value is SoundProgrammeId {
  return soundProgrammeIds.some((id) => id === value)
}

export function binauralTones({ carrier, beat }: SoundProgramme): readonly [number, number] {
  return [carrier, carrier + beat]
}

export function timerSeconds(timer: SoundTimer): number | null {
  return timer === null ? null : timer * 60
}
