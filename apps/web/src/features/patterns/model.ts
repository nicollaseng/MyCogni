import type { Assessment, CheckIn, PatientInsight } from '@mycogni/contracts'
import {
  consistencyOf,
  contextEffects,
  frequentTags,
  domainOf,
  moodByWeekday,
  moodDays,
  notableEffects,
  patternRules,
  patternUnlocks,
  periodSummary,
  screeningDomains,
  withinDays,
  type ContextEffect,
  type MoodDay,
  type PatternPeriod,
  type PeriodSummary,
  type SectionStatus,
  type TagCount,
  type WeekdayMood,
} from '@mycogni/domain'

export interface PatternsInput {
  period: PatternPeriod
  checkIns: readonly CheckIn[]
  totalCheckIns: number
  recentCheckIns: number
  assessments: readonly Assessment[]
  readings: readonly PatientInsight[]
  summariesEnabled: boolean
  timeZone: string
  now: Date
}

export interface PatternsModel {
  period: PatternPeriod
  hasHistory: boolean
  days: MoodDay[]
  summary: PeriodSummary
  recordedDays: number
  streak: number
  better: ContextEffect[]
  harder: ContextEffect[]
  weekdays: WeekdayMood[]
  emotions: TagCount[]
  contexts: TagCount[]
  assessments: Assessment[]
  readings: readonly PatientInsight[]
  statuses: SectionStatus[]
}

export const compactTags = 3
const shownEffects = 3

export function buildPatterns(input: PatternsInput): PatternsModel {
  const { period, timeZone, now } = input
  const window = { timeZone, today: now, days: period }
  const moods = input.checkIns.map((checkIn) => ({
    moodLevel: checkIn.moodLevel,
    recordedAt: new Date(checkIn.recordedAt),
    emotions: checkIn.emotions,
    contexts: checkIn.contexts,
  }))
  const inPeriod = withinDays(moods, window)
  const history = moodDays(moods, { timeZone, today: now, days: 2 * period })
  const days = history.slice(-period)
  const recordedDays = days.filter((day) => day.count > 0).length
  const comparable = contextEffects(inPeriod, { timeZone, minDays: patternRules.minContextDays })
  const effects = notableEffects(comparable, {
    minDifference: patternRules.minContextDifference,
    limit: patternRules.contextEffects,
  })
  const answered = new Set(
    withinDays(
      input.assessments.map(({ id, completedAt }) => ({ id, recordedAt: new Date(completedAt) })),
      window,
    ).map(({ id }) => id),
  )
  const assessments = input.assessments.filter(({ id }) => answered.has(id))
  const scoreSessions = Math.max(
    ...screeningDomains.map(
      (domain) =>
        assessments.filter((assessment) => domainOf(assessment.instrument) === domain).length,
    ),
  )

  return {
    period,
    hasHistory: input.totalCheckIns > 0,
    days,
    summary: periodSummary(history, period),
    recordedDays,
    streak: consistencyOf(
      moods.map((mood) => mood.recordedAt),
      window,
    ).currentStreak,
    better: effects.filter((effect) => effect.difference > 0).slice(0, shownEffects),
    harder: effects
      .filter((effect) => effect.difference < 0)
      .reverse()
      .slice(0, shownEffects),
    weekdays: moodByWeekday(inPeriod, { timeZone }),
    emotions: frequentTags(
      inPeriod.map((mood) => mood.emotions),
      compactTags,
    ),
    contexts: frequentTags(
      inPeriod.map((mood) => mood.contexts),
      compactTags,
    ),
    assessments,
    readings: input.readings,
    statuses: patternUnlocks({
      periodDays: period,
      recordedDays,
      checkIns: inPeriod.length,
      comparableContexts: comparable.length,
      scoreSessions,
      summary: {
        ready: input.readings.length > 0,
        enabled: input.summariesEnabled,
        recorded: input.recentCheckIns,
      },
    }),
  }
}
