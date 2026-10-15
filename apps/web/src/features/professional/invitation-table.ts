import type { SentInvitation } from '@mycogni/contracts'
import { normalizeText } from './patient-table'

export const invitationFilters = [
  'all',
  'pending',
  'accepted',
  'declined',
  'expired',
  'canceled',
] as const

export type InvitationFilter = (typeof invitationFilters)[number]

export interface InvitationView {
  filter: InvitationFilter
  query: string
}

function matchesQuery(invitation: SentInvitation, query: string): boolean {
  const wanted = normalizeText(query)
  if (wanted === '') {
    return true
  }
  return [invitation.recipientEmail ?? '', invitation.code].some((value) =>
    normalizeText(value).includes(wanted),
  )
}

export function visibleInvitations(
  invitations: readonly SentInvitation[],
  { filter, query }: InvitationView,
): SentInvitation[] {
  return invitations.filter(
    (invitation) =>
      (filter === 'all' || invitation.status === filter) && matchesQuery(invitation, query),
  )
}

export function invitationCounts(
  invitations: readonly SentInvitation[],
): Record<InvitationFilter, number> {
  const counts: Record<InvitationFilter, number> = {
    all: invitations.length,
    pending: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    canceled: 0,
  }
  for (const invitation of invitations) {
    counts[invitation.status] += 1
  }
  return counts
}
