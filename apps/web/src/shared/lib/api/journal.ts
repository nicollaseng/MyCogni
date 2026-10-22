import {
  journalAccessListSchema,
  journalEntryPageSchema,
  journalEntrySchema,
  journalShareListSchema,
  journalShareSchema,
  savedJournalEntrySchema,
  type CreateJournalShareInput,
  type JournalAccess,
  type JournalEntry,
  type JournalEntryPage,
  type JournalShare,
  type SavedJournalEntry,
  type UpdateJournalEntryInput,
} from '@mycogni/contracts'
import { z } from 'zod'
import { ApiError, apiRequest } from './client'

export interface JournalFilter {
  q?: string
  page?: number
  size?: number
}

function journalQuery({ q, page, size }: JournalFilter): string {
  const query = new URLSearchParams()
  if (q !== undefined && q !== '') {
    query.set('q', q)
  }
  if (page !== undefined) {
    query.set('page', String(page))
  }
  if (size !== undefined) {
    query.set('size', String(size))
  }
  return query.toString()
}

async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) {
      return null
    }
    throw error
  }
}

export function fetchJournal(filter: JournalFilter): Promise<JournalEntryPage> {
  return apiRequest({
    path: `/v1/journal?${journalQuery(filter)}`,
    schema: journalEntryPageSchema,
  })
}

export function createJournalEntry(): Promise<JournalEntry> {
  return apiRequest({ path: '/v1/journal', schema: journalEntrySchema, method: 'POST' })
}

export function fetchJournalEntry(id: string): Promise<JournalEntry | null> {
  return orNull(
    apiRequest({ path: `/v1/journal/${encodeURIComponent(id)}`, schema: journalEntrySchema }),
  )
}

export function updateJournalEntry(
  id: string,
  body: UpdateJournalEntryInput,
): Promise<SavedJournalEntry> {
  return apiRequest({
    path: `/v1/journal/${encodeURIComponent(id)}`,
    schema: savedJournalEntrySchema,
    method: 'PUT',
    body,
  })
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await apiRequest({
    path: `/v1/journal/${encodeURIComponent(id)}`,
    schema: z.null(),
    method: 'DELETE',
  })
}

export function fetchJournalShares(): Promise<JournalShare[]> {
  return apiRequest({ path: '/v1/journal/shares', schema: journalShareListSchema })
}

export function createJournalShare(body: CreateJournalShareInput): Promise<JournalShare> {
  return apiRequest({
    path: '/v1/journal/shares',
    schema: journalShareSchema,
    method: 'POST',
    body,
  })
}

export async function revokeJournalShare(id: string): Promise<void> {
  await apiRequest({
    path: `/v1/journal/shares/${encodeURIComponent(id)}/revoke`,
    schema: z.null(),
    method: 'POST',
  })
}

export function fetchJournalAccess(shareId: string): Promise<JournalAccess[]> {
  return apiRequest({
    path: `/v1/journal/shares/${encodeURIComponent(shareId)}/access`,
    schema: journalAccessListSchema,
  })
}

export async function fetchSharedJournal(
  patientId: string,
  filter: JournalFilter,
): Promise<JournalEntryPage | null> {
  return orNull(
    apiRequest({
      path: `/v1/professional/patients/${encodeURIComponent(patientId)}/journal?${journalQuery(filter)}`,
      schema: journalEntryPageSchema,
    }),
  )
}

export function fetchSharedJournalEntry(
  patientId: string,
  entryId: string,
): Promise<JournalEntry | null> {
  return orNull(
    apiRequest({
      path: `/v1/professional/patients/${encodeURIComponent(patientId)}/journal/${encodeURIComponent(entryId)}`,
      schema: journalEntrySchema,
    }),
  )
}
