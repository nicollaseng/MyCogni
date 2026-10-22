import type { MeditationId } from './meditation-ids.ts'

export const articleIds = [
  'anxiety-basics',
  'worry-time',
  'breathing-and-grounding',
  'performance-anxiety',
  'behavioural-activation',
  'sleep-and-mood',
  'screening-not-diagnosis',
  'when-to-seek-help',
] as const

export type ArticleId = (typeof articleIds)[number]

export const trackIds = [
  'everyday-anxiety',
  'performance-anxiety',
  'low-mood',
  'sleep-and-rest',
  'seeking-help',
] as const

export type TrackId = (typeof trackIds)[number]

export const stepKinds = [
  'read',
  'breathe',
  'write',
  'check_in',
  'reflect',
  'questionnaire',
  'support',
  'meditate',
] as const

export type StepKind = (typeof stepKinds)[number]

export type TrackStep =
  | { id: string; kind: 'read'; article: ArticleId }
  | { id: string; kind: 'meditate'; meditation: MeditationId }
  | { id: string; kind: Exclude<StepKind, 'read' | 'meditate'> }

export interface Track {
  id: TrackId
  steps: readonly [TrackStep, ...TrackStep[]]
}

export const tracks: Readonly<Record<TrackId, Track>> = {
  'everyday-anxiety': {
    id: 'everyday-anxiety',
    steps: [
      { id: 'read-anxiety-basics', kind: 'read', article: 'anxiety-basics' },
      { id: 'breathe', kind: 'breathe' },
      { id: 'meditate-anxiety', kind: 'meditate', meditation: 'anxiety' },
      { id: 'read-worry-time', kind: 'read', article: 'worry-time' },
      { id: 'write-worry', kind: 'write' },
      { id: 'check-in', kind: 'check_in' },
      { id: 'reflect', kind: 'reflect' },
    ],
  },
  'performance-anxiety': {
    id: 'performance-anxiety',
    steps: [
      { id: 'read-performance-anxiety', kind: 'read', article: 'performance-anxiety' },
      { id: 'read-breathing', kind: 'read', article: 'breathing-and-grounding' },
      { id: 'breathe', kind: 'breathe' },
      { id: 'write-prediction', kind: 'write' },
      { id: 'reflect', kind: 'reflect' },
      { id: 'check-in', kind: 'check_in' },
    ],
  },
  'low-mood': {
    id: 'low-mood',
    steps: [
      { id: 'read-behavioural-activation', kind: 'read', article: 'behavioural-activation' },
      { id: 'write-activities', kind: 'write' },
      { id: 'meditate-heavy-days', kind: 'meditate', meditation: 'heavy-days' },
      { id: 'check-in', kind: 'check_in' },
      { id: 'reflect', kind: 'reflect' },
      { id: 'questionnaires', kind: 'questionnaire' },
    ],
  },
  'sleep-and-rest': {
    id: 'sleep-and-rest',
    steps: [
      { id: 'read-sleep-and-mood', kind: 'read', article: 'sleep-and-mood' },
      { id: 'write-nights', kind: 'write' },
      { id: 'breathe', kind: 'breathe' },
      { id: 'read-worry-time', kind: 'read', article: 'worry-time' },
      { id: 'reflect', kind: 'reflect' },
    ],
  },
  'seeking-help': {
    id: 'seeking-help',
    steps: [
      { id: 'read-when-to-seek-help', kind: 'read', article: 'when-to-seek-help' },
      { id: 'support', kind: 'support' },
      { id: 'read-screening-not-diagnosis', kind: 'read', article: 'screening-not-diagnosis' },
      { id: 'write-for-professional', kind: 'write' },
    ],
  },
}

export function isTrackId(value: unknown): value is TrackId {
  return trackIds.some((id) => id === value)
}

export function isArticleId(value: unknown): value is ArticleId {
  return articleIds.some((id) => id === value)
}

export function stepOf(trackId: TrackId, stepId: string): TrackStep | undefined {
  return tracks[trackId].steps.find((step) => step.id === stepId)
}

export function isTrackStep(trackId: unknown, stepId: unknown): boolean {
  return isTrackId(trackId) && typeof stepId === 'string' && stepOf(trackId, stepId) !== undefined
}
