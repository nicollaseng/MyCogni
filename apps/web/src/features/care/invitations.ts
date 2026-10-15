import type { ReceivedInvitation } from '@mycogni/contracts'
import { invitationStatuses, type InvitationStatus } from '@mycogni/domain'

export type ClosedStatus = Exclude<InvitationStatus, 'pending'>

export interface InvitationGroup {
  status: InvitationStatus
  invitations: ReceivedInvitation[]
}

export function groupInvitations(invitations: readonly ReceivedInvitation[]): InvitationGroup[] {
  return invitationStatuses.flatMap((status) => {
    const matching = invitations
      .filter((invitation) => invitation.status === status)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    return matching.length === 0 ? [] : [{ status, invitations: matching }]
  })
}

export function statusDate(invitation: ReceivedInvitation): string {
  switch (invitation.status) {
    case 'pending':
      return invitation.createdAt
    case 'expired':
      return invitation.expiresAt
    default:
      return invitation.respondedAt ?? invitation.createdAt
  }
}

export interface TimeLeft {
  unit: 'days' | 'hours'
  count: number
}

const hourInMs = 60 * 60 * 1000

export function timeLeft(expiresAt: Date, now: Date): TimeLeft {
  const hours = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / hourInMs))
  return hours >= 24
    ? { unit: 'days', count: Math.floor(hours / 24) }
    : { unit: 'hours', count: hours }
}
