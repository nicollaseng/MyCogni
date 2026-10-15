export const supportSubjects = [
  'account',
  'technical',
  'privacy',
  'professional',
  'billing',
  'suggestion',
  'other',
] as const

export type SupportSubject = (typeof supportSubjects)[number]

export const supportTicketStatuses = ['pending', 'in_progress', 'closed'] as const

export type SupportTicketStatus = (typeof supportTicketStatuses)[number]

export const supportRequesterRoles = ['patient', 'professional'] as const

export type SupportRequesterRole = (typeof supportRequesterRoles)[number]

export const supportLimits = {
  messageMin: 10,
  messageMax: 4000,
  customSubjectMin: 3,
  customSubjectMax: 120,
  closingNote: 1000,
  ticketsPerWindow: 5,
  windowSeconds: 24 * 60 * 60,
} as const

const transitions: Readonly<Record<SupportTicketStatus, readonly SupportTicketStatus[]>> = {
  pending: ['in_progress', 'closed'],
  in_progress: ['closed'],
  closed: [],
}

export function nextSupportStatuses(status: SupportTicketStatus): readonly SupportTicketStatus[] {
  return transitions[status]
}

export function canMoveSupportTicket(from: SupportTicketStatus, to: SupportTicketStatus): boolean {
  return transitions[from].includes(to)
}

export function needsCustomSubject(subject: SupportSubject): boolean {
  return subject === 'other'
}

export function supportTicketLabel(number: number): string {
  return `#${String(number)}`
}
