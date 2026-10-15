import type { AdminSupportTicket } from '@mycogni/contracts'
import {
  supportTicketLabel,
  supportTicketStatuses,
  type SupportTicketStatus,
} from '@mycogni/domain'
import { normalizeText } from '@/shared/lib/text'

export type InboxSortKey = 'number' | 'createdAt'

export interface InboxSort {
  key: InboxSortKey
  direction: 'asc' | 'desc'
}

export interface InboxView {
  query: string
  sort: InboxSort
}

export function inboxStatusOf(value: string | string[] | undefined): SupportTicketStatus {
  return supportTicketStatuses.find((status) => status === value) ?? 'pending'
}

export function defaultInboxSort(status: SupportTicketStatus): InboxSort {
  return { key: 'createdAt', direction: status === 'closed' ? 'desc' : 'asc' }
}

export function nextInboxSort(current: InboxSort, key: InboxSortKey): InboxSort {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }
  return { key, direction: 'asc' }
}

function searchable(ticket: AdminSupportTicket, subject: string): string[] {
  return [
    supportTicketLabel(ticket.number),
    String(ticket.number),
    ticket.requester.name ?? '',
    ticket.requester.email ?? '',
    subject,
  ]
}

export function visibleTickets(
  tickets: readonly AdminSupportTicket[],
  { query, sort }: InboxView,
  subjectOf: (ticket: AdminSupportTicket) => string,
): AdminSupportTicket[] {
  const wanted = normalizeText(query)
  const sign = sort.direction === 'asc' ? 1 : -1
  return tickets
    .filter(
      (ticket) =>
        wanted === '' ||
        searchable(ticket, subjectOf(ticket)).some((value) =>
          normalizeText(value).includes(wanted),
        ),
    )
    .sort((first, second) =>
      sort.key === 'number'
        ? sign * (first.number - second.number)
        : sign * first.createdAt.localeCompare(second.createdAt),
    )
}
