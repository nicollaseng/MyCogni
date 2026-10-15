export const invitationStatuses = [
  'pending',
  'accepted',
  'declined',
  'canceled',
  'expired',
] as const

export type InvitationStatus = (typeof invitationStatuses)[number]

export const invitationChannels = ['email', 'link'] as const

export type InvitationChannel = (typeof invitationChannels)[number]

export const invitationLifetimeHours = 72

export const sharingConsentVersion = '2026-10'

export const invitationCodeAlphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export const invitationCodeLength = 8

const codePattern = new RegExp(`^[${invitationCodeAlphabet}]{${String(invitationCodeLength)}}$`)

export function generateInvitationCode(pickIndex: (size: number) => number): string {
  return Array.from({ length: invitationCodeLength }, () =>
    invitationCodeAlphabet.charAt(pickIndex(invitationCodeAlphabet.length)),
  ).join('')
}

export function normalizeInvitationCode(value: string): string {
  return value.trim().toUpperCase()
}

export function isInvitationCode(value: string): boolean {
  return codePattern.test(value)
}

export function invitationExpiry(createdAt: Date): Date {
  return new Date(createdAt.getTime() + invitationLifetimeHours * 60 * 60 * 1000)
}

export function effectiveStatus(
  { status, expiresAt }: { status: InvitationStatus; expiresAt: Date },
  now: Date,
): InvitationStatus {
  return status === 'pending' && expiresAt.getTime() <= now.getTime() ? 'expired' : status
}
