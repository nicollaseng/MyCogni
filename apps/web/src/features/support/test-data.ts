import type { AdminSupportTicket, SupportTicket } from '@mycogni/contracts'

export const pendingTicket: SupportTicket = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000061',
  number: 1042,
  subject: 'technical',
  customSubject: null,
  message: 'O app fecha sozinho quando abro os registros.',
  role: 'patient',
  status: 'pending',
  attachment: { fileName: 'tela.png', contentType: 'image/png', sizeBytes: 245_760 },
  closingNote: null,
  createdAt: '2026-10-14T12:00:00Z',
  takenAt: null,
  closedAt: null,
}

export const closedTicket: SupportTicket = {
  ...pendingTicket,
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000062',
  number: 1043,
  subject: 'other',
  customSubject: 'Exportar dados',
  status: 'closed',
  attachment: null,
  closingNote: 'Enviamos o arquivo por email.',
  createdAt: '2026-10-13T09:00:00Z',
  closedAt: '2026-10-13T15:30:00Z',
}

export function adminTicket(
  ticket: SupportTicket,
  requester: AdminSupportTicket['requester'],
): AdminSupportTicket {
  return { ...ticket, locale: 'pt-BR', requester }
}
