export const patternRules = {
  windowDays: 90,
  consistencyDays: 30,
  recentDays: 14,
  minWeekdayDays: 14,
  minContextDays: 4,
  minContextDifference: 0.3,
  contextEffects: 5,
  minTaggedCheckIns: 5,
  frequentTags: 5,
  minScoreSessions: 2,
} as const

export const moodReportPeriods = [7, 30] as const

export type MoodReportPeriod = (typeof moodReportPeriods)[number]
