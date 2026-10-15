import { describe, expect, it } from '@jest/globals'
import { attentionPatients, overviewKpis, weeklyCheckIns } from './overview'
import { activity, overview, patient } from './test-data'

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
  it('sums up engagement, attention and pending invitations', () => {
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
      ),
    ).toEqual({
      patients: 4,
      engaged: 3,
      engagement: 0.75,
      checkIns: 6,
      previousCheckIns: 0,
      attention: 2,
      risk: 1,
      pendingInvitations: 3,
      expiringSoon: 1,
    })
  })

  it('has no engagement rate without patients', () => {
    expect(overviewKpis([], overview()).engagement).toBeNull()
  })
})

describe('attentionPatients', () => {
  it('lists only flagged patients, the most urgent first', () => {
    const calm = patient({ name: 'Ana Lima' })
    const inactive = patient({ name: 'Bia Souza', attention: ['inactive'] })
    const risk = patient({ name: 'Caio Melo', attention: ['risk_item'] })

    expect(attentionPatients([calm, inactive, risk])).toEqual([risk, inactive])
  })
})
