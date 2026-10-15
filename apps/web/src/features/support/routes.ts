import type { SupportRequesterRole } from '@mycogni/domain'

export function supportHomeOf(role: SupportRequesterRole) {
  return role === 'professional' ? ('/pro/settings#support' as const) : ('/me#support' as const)
}

export function ticketHrefOf(role: SupportRequesterRole, id: string) {
  return role === 'professional' ? (`/pro/support/${id}` as const) : (`/support/${id}` as const)
}

export function newTicketHrefOf(role: SupportRequesterRole) {
  return role === 'professional' ? ('/pro/support/new' as const) : ('/support/new' as const)
}
