import { describe, expect, it } from '@jest/globals'
import type { Notification } from '@mycogni/contracts'
import { notificationHref } from './notification-href'

const invitationId = '7a1c2b3d-0000-4000-8000-000000000010'
const insightId = '7a1c2b3d-0000-4000-8000-000000000020'

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: '7a1c2b3d-0000-4000-8000-000000000001',
    kind: 'system',
    createdAt: '2026-10-14T15:00:00.000Z',
    readAt: null,
    insightId: null,
    invitation: null,
    ...overrides,
  }
}

describe('notificationHref', () => {
  it('opens the invitation an invitation notification is about', () => {
    expect(
      notificationHref(
        notification({
          kind: 'invitation',
          invitation: {
            id: invitationId,
            status: 'pending',
            professional: { name: 'Helena Prado', kind: 'psychologist' },
          },
        }),
      ),
    ).toBe(`/invites/${invitationId}`)
  })

  it('opens the professionals of the person for link events', () => {
    expect(notificationHref(notification({ kind: 'professional' }))).toBe('/me#professionals')
  })

  it('opens the reading of the weekly summary on Padrões', () => {
    expect(notificationHref(notification({ kind: 'insight', insightId }))).toBe(
      `/patterns#reading-${insightId}`,
    )
  })

  it('keeps notices and news on the notifications page', () => {
    expect(notificationHref(notification({ kind: 'system' }))).toBe('/notifications')
    expect(notificationHref(notification({ kind: 'marketing' }))).toBe('/notifications')
  })

  it('falls back to the notifications page when the target is gone', () => {
    expect(notificationHref(notification({ kind: 'invitation' }))).toBe('/notifications')
    expect(notificationHref(notification({ kind: 'insight' }))).toBe('/notifications')
  })
})
