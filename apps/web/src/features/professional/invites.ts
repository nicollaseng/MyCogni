import type { CreatedInvitation } from '@mycogni/contracts'
import type { InvitationStatus } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'

export type InviteInput = { channel: 'email'; recipientEmail: string } | { channel: 'link' }

export type Invite = (input: InviteInput) => Promise<ActionResult<CreatedInvitation>>

export type ResendInvite = (id: string) => Promise<ActionResult<CreatedInvitation>>

export type CancelInvite = (id: string) => Promise<ActionResult<null>>

export function canResend(status: InvitationStatus): boolean {
  return status === 'pending' || status === 'expired'
}

export function isOpen(status: InvitationStatus): boolean {
  return status === 'pending'
}
