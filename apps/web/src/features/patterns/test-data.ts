import type { CheckIn } from '@mycogni/contracts'
import type { PatternPeriod } from '@mycogni/domain'
import { assessmentOf } from '@/features/onboarding/test/fixtures'
import { patientReading } from '@/features/insights/test-data'
import { buildPatterns, type PatternsInput, type PatternsModel } from './model'

export const patternsNow = new Date('2026-10-15T15:00:00Z')
export const patternsZone = 'America/Sao_Paulo'

const dayInMs = 24 * 60 * 60 * 1000

export function richHistory(days: number): CheckIn[] {
  return Array.from({ length: days }, (_, daysAgo) => daysAgo)
    .filter((daysAgo) => daysAgo % 7 !== 3)
    .map((daysAgo) => {
      const exercise = daysAgo % 3 === 0
      const work = daysAgo % 2 === 1
      return {
        id: `0b7c6c8e-6a8f-4f53-9f4b-${String(daysAgo).padStart(12, '0')}`,
        moodLevel: 3 + (exercise ? 2 : 0) - (work ? 1 : 0),
        emotions: exercise ? ['calm'] : ['anxiety'],
        contexts: [...(exercise ? ['exercise'] : []), ...(work ? ['work'] : [])],
        note: null,
        recordedAt: new Date(patternsNow.getTime() - daysAgo * dayInMs).toISOString(),
      }
    })
}

export function patternsOf(
  period: PatternPeriod,
  overrides: Partial<PatternsInput> = {},
): PatternsModel {
  const checkIns = overrides.checkIns ?? richHistory(60)
  return buildPatterns({
    period,
    checkIns,
    totalCheckIns: checkIns.length,
    recentCheckIns: checkIns.length,
    assessments: [
      assessmentOf({
        id: '0b7c6c8e-6a8f-4f53-9f4b-000000000101',
        completedAt: '2026-09-20T12:00:00Z',
      }),
      assessmentOf({
        id: '0b7c6c8e-6a8f-4f53-9f4b-000000000102',
        totalScore: 5,
        severity: 'mild',
        completedAt: '2026-10-10T12:00:00Z',
      }),
    ],
    readings: [patientReading(14), patientReading(7)],
    summariesEnabled: true,
    timeZone: patternsZone,
    now: patternsNow,
    ...overrides,
  })
}

export const newcomer: Partial<PatternsInput> = {
  checkIns: [],
  totalCheckIns: 0,
  recentCheckIns: 0,
  assessments: [assessmentOf({ completedAt: '2026-10-15T12:00:00Z' })],
  readings: [],
  summariesEnabled: false,
}
