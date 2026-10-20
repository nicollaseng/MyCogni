import type { InstrumentId, Severity } from '../assessments/instrument.ts'
import { lowMoodAverage } from '../care/attention.ts'
import { stepOf, tracks, type ArticleId, type TrackId } from './catalog.ts'
import type { DoneStep } from './progress.ts'
import type { RecordSignal } from './signals.ts'

export interface ScreeningSignal {
  instrument: InstrumentId
  severity: Severity
  hasRiskFlag: boolean
}

export interface ZenSignals {
  latest: readonly ScreeningSignal[]
  moodAverage: number | null
  records?: readonly RecordSignal[]
  night?: boolean
}

export const suggestionReasons = [
  'risk_item',
  'severe_result',
  'anxiety',
  'depression',
  'low_mood',
  'frequent_sleep',
  'work_pressure',
  'frequent_anxiety',
  'night',
  'starting',
] as const

export const frequentSleepRecords = 3

export const workPressureRecords = 2

export const workPressureMood = 2

export const frequentAnxietyRecords = 3

const sleepContext = 'sleep'

const pressureContexts: readonly string[] = ['work', 'studies']

const anxietyEmotion = 'anxiety'

const safetyReasons: readonly SuggestionReason[] = ['risk_item', 'severe_result']

const nightTrack: TrackId = 'sleep-and-rest'

export type SuggestionReason = (typeof suggestionReasons)[number]

export interface ZenSuggestion {
  reasons: SuggestionReason[]
  tracks: TrackId[]
}

interface Rule {
  reason: Exclude<SuggestionReason, 'starting' | 'night'>
  track: TrackId
  applies: (signals: ZenSignals) => boolean
}

function severityOf(signals: ZenSignals, instrument: InstrumentId): Severity | undefined {
  return signals.latest.find((signal) => signal.instrument === instrument)?.severity
}

function isAmong(severity: Severity | undefined, accepted: readonly Severity[]): boolean {
  return severity !== undefined && accepted.includes(severity)
}

function countRecords(signals: ZenSignals, matches: (record: RecordSignal) => boolean): number {
  return (signals.records ?? []).filter(matches).length
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
  {
    reason: 'frequent_sleep',
    track: 'sleep-and-rest',
    applies: (signals) =>
      countRecords(signals, (record) => record.contexts.includes(sleepContext)) >=
      frequentSleepRecords,
  },
  {
    reason: 'work_pressure',
    track: 'performance-anxiety',
    applies: (signals) =>
      countRecords(
        signals,
        (record) =>
          record.moodLevel <= workPressureMood &&
          record.contexts.some((context) => pressureContexts.includes(context)),
      ) >= workPressureRecords,
  },
  {
    reason: 'frequent_anxiety',
    track: 'everyday-anxiety',
    applies: (signals) =>
      countRecords(signals, (record) => record.emotions.includes(anxietyEmotion)) >=
      frequentAnxietyRecords,
  },
]

const startingTrack: TrackId = 'sleep-and-rest'

function byRules(signals: ZenSignals): ZenSuggestion {
  const applied = rules.filter((rule) => rule.applies(signals))
  if (applied.length === 0) {
    return { reasons: ['starting'], tracks: [startingTrack] }
  }
  return {
    reasons: applied.map((rule) => rule.reason),
    tracks: [...new Set(applied.map((rule) => rule.track))],
  }
}

export function zenSuggestion(signals: ZenSignals): ZenSuggestion {
  const suggestion = byRules(signals)
  const safety = suggestion.reasons.some((reason) => safetyReasons.includes(reason))
  if (signals.night !== true || safety) {
    return suggestion
  }
  return {
    reasons: [...suggestion.reasons, 'night'],
    tracks: [...new Set([nightTrack, ...suggestion.tracks])],
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
