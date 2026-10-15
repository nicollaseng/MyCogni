import type { InstrumentId, Severity } from '../../assessments/instrument.ts'
import type { ContextId, EmotionId } from '../../check-ins/catalog.ts'

export const moodNames = [
  'veryBad',
  'bad',
  'slightlyBad',
  'neutral',
  'slightlyGood',
  'good',
  'veryGood',
] as const

export type MoodName = (typeof moodNames)[number]

export interface LabelSet {
  emotions: Readonly<Record<EmotionId, string>>
  contexts: Readonly<Record<ContextId, string>>
  instruments: Readonly<Record<InstrumentId, string>>
  severities: Readonly<Record<Severity, string>>
  moods: Readonly<Record<MoodName, string>>
}
