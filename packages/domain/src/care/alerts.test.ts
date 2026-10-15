import { describe, expect, it } from '@jest/globals'
import {
  alertLevelOf,
  alertReasons,
  alertsFor,
  alertStatusOf,
  cooldownStart,
  emailsRightAway,
  emailWindowStart,
} from './alerts.ts'
import type { AttentionSignals } from './attention.ts'

const now = new Date('2026-10-15T12:00:00Z')

const steady: AttentionSignals = {
  latestPhq9: { severity: 'severe', hasRiskFlag: true },
  latestGad7: { severity: 'severe' },
  moodAverage: 4,
  previousMoodAverage: 4,
  lastCheckInAt: new Date('2026-10-14T20:00:00Z'),
  linkedAt: new Date('2026-09-01T12:00:00Z'),
  now,
}

describe('alertsFor', () => {
  it('raises an urgent alert for a positive PHQ-9 item 9, next to a severe score', () => {
    expect(
      alertsFor({
        kind: 'screening',
        result: { instrument: 'phq9', severity: 'severe', hasRiskFlag: true },
      }),
    ).toEqual([
      { reason: 'risk_item', level: 'urgent' },
      { reason: 'severe_screening', level: 'watch' },
    ])
  })

  it('asks to watch a severe GAD-7 and stays quiet for milder answers', () => {
    expect(
      alertsFor({
        kind: 'screening',
        result: { instrument: 'gad7', severity: 'moderately_severe', hasRiskFlag: false },
      }),
    ).toEqual([{ reason: 'severe_screening', level: 'watch' }])
    expect(
      alertsFor({
        kind: 'screening',
        result: { instrument: 'phq9', severity: 'moderate', hasRiskFlag: false },
      }),
    ).toEqual([])
  })

  it('only looks at mood after a check-in, whatever the questionnaires said before', () => {
    expect(alertsFor({ kind: 'check_in', signals: steady })).toEqual([])
    expect(
      alertsFor({
        kind: 'check_in',
        signals: { ...steady, moodAverage: 1.5, previousMoodAverage: 3 },
      }),
    ).toEqual([
      { reason: 'low_mood', level: 'watch' },
      { reason: 'mood_drop', level: 'watch' },
    ])
  })

  it('reports a week without records as information on the daily review', () => {
    const quiet = { ...steady, lastCheckInAt: new Date('2026-10-07T12:00:00Z'), moodAverage: 1 }

    expect(alertsFor({ kind: 'daily', signals: quiet })).toEqual([
      { reason: 'inactive', level: 'info' },
    ])
    expect(alertsFor({ kind: 'daily', signals: steady })).toEqual([])
  })

  it('follows the attention level of a professional summary', () => {
    expect(alertsFor({ kind: 'summary', attention: 'urgent' })).toEqual([
      { reason: 'summary_urgent', level: 'urgent' },
    ])
    expect(alertsFor({ kind: 'summary', attention: 'watch' })).toEqual([
      { reason: 'summary_watch', level: 'watch' },
    ])
    expect(alertsFor({ kind: 'summary', attention: 'none' })).toEqual([])
  })

  it('gives every reason a level, urgent ones first', () => {
    expect(alertReasons.map((reason) => alertLevelOf[reason])).toEqual([
      'urgent',
      'urgent',
      'watch',
      'watch',
      'watch',
      'watch',
      'info',
    ])
  })
})

describe('alert timing', () => {
  it('lets new answers raise again but waits a week for mood and inactivity', () => {
    expect(cooldownStart('risk_item', now)).toBeNull()
    expect(cooldownStart('summary_watch', now)).toBeNull()
    expect(cooldownStart('low_mood', now)).toEqual(new Date('2026-10-08T12:00:00Z'))
    expect(cooldownStart('inactive', now)).toEqual(new Date('2026-10-08T12:00:00Z'))
  })

  it('emails only urgent alerts, at most once a day per patient', () => {
    expect(emailsRightAway('urgent')).toBe(true)
    expect(emailsRightAway('watch')).toBe(false)
    expect(emailsRightAway('info')).toBe(false)
    expect(emailWindowStart(now)).toEqual(new Date('2026-10-14T12:00:00Z'))
  })
})

describe('alertStatusOf', () => {
  it('is open until seen and resolved once closed', () => {
    expect(alertStatusOf({ acknowledgedAt: null, resolvedAt: null })).toBe('open')
    expect(alertStatusOf({ acknowledgedAt: now, resolvedAt: null })).toBe('acknowledged')
    expect(alertStatusOf({ acknowledgedAt: now, resolvedAt: now })).toBe('resolved')
    expect(alertStatusOf({ acknowledgedAt: null, resolvedAt: '2026-10-15T12:00:00Z' })).toBe(
      'resolved',
    )
  })
})
