import { describe, expect, it } from '@jest/globals'
import { overviewKpis, weeklyCheckIns } from './overview'
import { activity, alert, overview, patient } from './test-data'

describe('weeklyCheckIns', () => {
  it('adds up the last 7 days and the 7 days before them', () => {
    const counts = [
      9,
      9,
      ...Array.from({ length: 7 }, () => 1),
      ...Array.from({ length: 7 }, () => 2),
    ]

    expect(weeklyCheckIns(activity(counts))).toEqual({ current: 14, previous: 7 })
  })

  it('treats missing history as zero', () => {
    expect(weeklyCheckIns(activity([3, 4]))).toEqual({ current: 7, previous: 0 })
  })
})

describe('overviewKpis', () => {
  it('sums up engagement, pending alerts and pending invitations', () => {
    const patients = [
      patient({ checkInsLastWeek: 3 }),
      patient({ checkInsLastWeek: 0, attention: ['inactive'] }),
      patient({ checkInsLastWeek: 2, attention: ['risk_item', 'low_mood'] }),
      patient({ checkInsLastWeek: 1 }),
    ]
    const counts = [...Array.from({ length: 23 }, () => 0), 1, 1, 1, 1, 1, 1, 0]

    expect(
      overviewKpis(
        patients,
        overview({
          activity: activity(counts),
          invitations: { pending: 3, expiringSoon: 1 },
        }),
        [
          alert({ level: 'urgent', reason: 'risk_item' }),
          alert({ level: 'urgent', reason: 'summary_urgent', status: 'resolved' }),
          alert({ level: 'watch', status: 'acknowledged' }),
          alert({ level: 'info', reason: 'inactive' }),
        ],
      ),
    ).toEqual({
      patients: 4,
      engaged: 3,
      engagement: 0.75,
      checkIns: 6,
      previousCheckIns: 0,
      pendingAlerts: 3,
      urgentAlerts: 1,
      pendingInvitations: 3,
      expiringSoon: 1,
    })
  })

  it('has no engagement rate without patients', () => {
    expect(overviewKpis([], overview(), []).engagement).toBeNull()
  })
})
