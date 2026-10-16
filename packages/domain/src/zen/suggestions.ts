import type { InstrumentId, Severity } from '../assessments/instrument.ts'
import { lowMoodAverage } from '../care/attention.ts'
import { stepOf, tracks, type ArticleId, type TrackId } from './catalog.ts'
import type { DoneStep } from './progress.ts'

export interface ScreeningSignal {
  instrument: InstrumentId
  severity: Severity
  hasRiskFlag: boolean
}

export interface ZenSignals {
  latest: readonly ScreeningSignal[]
  moodAverage: number | null
}

export const suggestionReasons = [
  'risk_item',
  'severe_result',
  'anxiety',
  'depression',
  'low_mood',
  'starting',
] as const

export type SuggestionReason = (typeof suggestionReasons)[number]

export interface ZenSuggestion {
  reasons: SuggestionReason[]
  tracks: TrackId[]
}

interface Rule {
  reason: Exclude<SuggestionReason, 'starting'>
  track: TrackId
  applies: (signals: ZenSignals) => boolean
}

function severityOf(signals: ZenSignals, instrument: InstrumentId): Severity | undefined {
  return signals.latest.find((signal) => signal.instrument === instrument)?.severity
}

function isAmong(severity: Severity | undefined, accepted: readonly Severity[]): boolean {
  return severity !== undefined && accepted.includes(severity)
}

const rules: readonly Rule[] = [
  {
    reason: 'risk_item',
    track: 'seeking-help',
    applies: (signals) => signals.latest.some((signal) => signal.hasRiskFlag),
  },
  {
    reason: 'severe_result',
    track: 'seeking-help',
    applies: (signals) =>
      isAmong(severityOf(signals, 'phq9'), ['moderately_severe', 'severe']) ||
      isAmong(severityOf(signals, 'gad7'), ['severe']),
  },
  {
    reason: 'anxiety',
    track: 'everyday-anxiety',
    applies: (signals) => isAmong(severityOf(signals, 'gad7'), ['moderate', 'severe']),
  },
  {
    reason: 'depression',
    track: 'low-mood',
    applies: (signals) =>
      isAmong(severityOf(signals, 'phq9'), ['moderate', 'moderately_severe', 'severe']),
  },
  {
    reason: 'low_mood',
    track: 'low-mood',
    applies: ({ moodAverage }) => moodAverage !== null && moodAverage <= lowMoodAverage,
  },
]

const startingTrack: TrackId = 'sleep-and-rest'

export function zenSuggestion(signals: ZenSignals): ZenSuggestion {
  const applied = rules.filter((rule) => rule.applies(signals))
  if (applied.length === 0) {
    return { reasons: ['starting'], tracks: [startingTrack] }
  }
  return {
    reasons: applied.map((rule) => rule.reason),
    tracks: [...new Set(applied.map((rule) => rule.track))],
  }
}

export function needsCrisisHelp(suggestion: ZenSuggestion): boolean {
  return suggestion.reasons.includes('risk_item')
}

export function readArticles(doneSteps: readonly DoneStep[]): ArticleId[] {
  return doneSteps.flatMap((entry) => {
    const step = stepOf(entry.trackId, entry.stepId)
    return step?.kind === 'read' ? [step.article] : []
  })
}

export function suggestedArticles(
  trackIds: readonly TrackId[],
  doneSteps: readonly DoneStep[],
  limit: number,
): ArticleId[] {
  const read = readArticles(doneSteps)
  const articles = trackIds.flatMap((trackId) =>
    tracks[trackId].steps.flatMap((step) =>
      step.kind === 'read' && !read.includes(step.article) ? [step.article] : [],
    ),
  )
  return [...new Set(articles)].slice(0, limit)
}
