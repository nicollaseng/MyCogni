export const meditationIds = ['anxiety', 'heavy-days', 'grief', 'focus', 'inner-peace'] as const

export type MeditationId = (typeof meditationIds)[number]

export const meditationLengths = ['short', 'long'] as const

export type MeditationLength = (typeof meditationLengths)[number]

export function isMeditationId(value: unknown): value is MeditationId {
  return meditationIds.some((id) => id === value)
}

export function isMeditationLength(value: unknown): value is MeditationLength {
  return meditationLengths.some((length) => length === value)
}
