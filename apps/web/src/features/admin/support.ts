import type { AdminSupportTicket, ChangeSupportStatusInput } from '@mycogni/contracts'
import type { ActionResult } from '@/shared/lib/actions/result'

export type ChangeTicketStatus = (
  id: string,
  input: ChangeSupportStatusInput,
) => Promise<ActionResult<AdminSupportTicket>>
