import {
  adminSupportTicketListSchema,
  adminSupportTicketSchema,
  createdSupportTicketSchema,
  documentLinkSchema,
  supportTicketListSchema,
  supportTicketSchema,
  type AdminSupportTicket,
  type ChangeSupportStatusInput,
  type CreatedSupportTicket,
  type CreateSupportTicketInput,
  type DocumentLink,
  type SupportTicket,
} from '@mycogni/contracts'
import type { SupportTicketStatus } from '@mycogni/domain'
import { ApiError, apiRequest } from './client'

async function orNull<T>(work: () => Promise<T>, statuses: readonly number[]): Promise<T | null> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof ApiError && statuses.includes(error.status)) {
      return null
    }
    throw error
  }
}

export function createSupportTicket(body: CreateSupportTicketInput): Promise<CreatedSupportTicket> {
  return apiRequest({
    path: '/v1/support/tickets',
    schema: createdSupportTicketSchema,
    method: 'POST',
    body,
  })
}

export function fetchSupportTickets(): Promise<SupportTicket[]> {
  return apiRequest({ path: '/v1/support/tickets', schema: supportTicketListSchema })
}

export function fetchSupportTicket(id: string): Promise<SupportTicket | null> {
  return orNull(
    () =>
      apiRequest({
        path: `/v1/support/tickets/${encodeURIComponent(id)}`,
        schema: supportTicketSchema,
      }),
    [400, 404],
  )
}

export function fetchAdminSupportTickets(
  status: SupportTicketStatus,
): Promise<AdminSupportTicket[] | null> {
  return orNull(
    () =>
      apiRequest({
        path: `/v1/admin/support/tickets?status=${status}`,
        schema: adminSupportTicketListSchema,
      }),
    [403],
  )
}

export function fetchAdminSupportTicket(id: string): Promise<AdminSupportTicket | null> {
  return orNull(
    () =>
      apiRequest({
        path: `/v1/admin/support/tickets/${encodeURIComponent(id)}`,
        schema: adminSupportTicketSchema,
      }),
    [400, 403, 404],
  )
}

export function fetchSupportAttachmentLink(id: string): Promise<DocumentLink | null> {
  return orNull(
    () =>
      apiRequest({
        path: `/v1/admin/support/tickets/${encodeURIComponent(id)}/attachment`,
        schema: documentLinkSchema,
      }),
    [400, 403, 404],
  )
}

export function changeSupportStatus(
  id: string,
  body: ChangeSupportStatusInput,
): Promise<AdminSupportTicket> {
  return apiRequest({
    path: `/v1/admin/support/tickets/${encodeURIComponent(id)}/status`,
    schema: adminSupportTicketSchema,
    method: 'POST',
    body,
  })
}
