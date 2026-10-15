import { describe, expect, it } from '@jest/globals'
import type { ReceivedInvitation } from '@mycogni/contracts'
import { groupInvitations, statusDate, timeLeft } from './invitations'

function invitation(overrides: Partial<ReceivedInvitation>): ReceivedInvitation {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    professional: { name: 'Helena Prado', kind: 'psychologist', registration: 'CRP 06/123456' },
    status: 'pending',
    createdAt: '2026-10-14T12:00:00.000Z',
    expiresAt: '2026-10-17T12:00:00.000Z',
    respondedAt: null,
    ...overrides,
  }
}

describe('groupInvitations', () => {
  it('puts pending invitations first, then the answered ones, newest first in each group', () => {
    const groups = groupInvitations([
      invitation({ id: 'expired', status: 'expired' }),
      invitation({ id: 'old-pending', createdAt: '2026-10-10T12:00:00.000Z' }),
      invitation({ id: 'accepted', status: 'accepted' }),
      invitation({ id: 'new-pending', createdAt: '2026-10-15T12:00:00.000Z' }),
      invitation({ id: 'canceled', status: 'canceled' }),
      invitation({ id: 'declined', status: 'declined' }),
    ])

    expect(groups.map((group) => group.status)).toEqual([
      'pending',
      'accepted',
      'declined',
      'canceled',
      'expired',
    ])
    expect(groups[0]?.invitations.map((item) => item.id)).toEqual(['new-pending', 'old-pending'])
  })

  it('leaves out statuses without invitations', () => {
    expect(groupInvitations([invitation({ status: 'declined' })]).map((g) => g.status)).toEqual([
      'declined',
    ])
    expect(groupInvitations([])).toEqual([])
  })
})

describe('statusDate', () => {
  it('dates each invitation by the moment that matters for its status', () => {
    expect(statusDate(invitation({}))).toBe('2026-10-14T12:00:00.000Z')
    expect(statusDate(invitation({ status: 'expired' }))).toBe('2026-10-17T12:00:00.000Z')
    expect(
      statusDate(invitation({ status: 'accepted', respondedAt: '2026-10-15T09:00:00.000Z' })),
    ).toBe('2026-10-15T09:00:00.000Z')
  })
})

describe('timeLeft', () => {
  const now = new Date('2026-10-14T12:00:00Z')

  it('counts whole days while more than a day is left', () => {
    expect(timeLeft(new Date('2026-10-17T12:00:00Z'), now)).toEqual({ unit: 'days', count: 3 })
    expect(timeLeft(new Date('2026-10-15T13:00:00Z'), now)).toEqual({ unit: 'days', count: 1 })
  })

  it('counts hours on the last day and never says zero', () => {
    expect(timeLeft(new Date('2026-10-14T17:30:00Z'), now)).toEqual({ unit: 'hours', count: 6 })
    expect(timeLeft(new Date('2026-10-14T12:10:00Z'), now)).toEqual({ unit: 'hours', count: 1 })
  })
})
