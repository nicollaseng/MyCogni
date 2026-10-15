import type { UpdateJournalEntryInput } from '@mycogni/contracts'
import { z } from 'zod'

export const pageClientHeader = 'x-mybook-client'

export const pageClientVersion = '1'

export const outdatedClientCode = 'OUTDATED_CLIENT'

export type SaveOutcome = { kind: 'saved'; updatedAt: string } | { kind: 'failed' | 'outdated' }

export type CreateOutcome = { kind: 'created'; id: string } | { kind: 'failed' | 'outdated' }

export type RemoveOutcome = 'removed' | 'failed' | 'outdated'

export interface PageClient {
  create: () => Promise<CreateOutcome>
  save: (id: string, input: UpdateJournalEntryInput) => Promise<SaveOutcome>
  remove: (id: string) => Promise<RemoveOutcome>
}

interface Answer {
  status: number
  ok: boolean
  payload: unknown
}

const refusalSchema = z.object({ code: z.string() })

const savedSchema = z.object({ updatedAt: z.iso.datetime({ offset: true }) })

const createdSchema = z.object({ id: z.uuid() })

function contentPath(id: string): string {
  return `/mybook/${encodeURIComponent(id)}/content`
}

async function payloadOf(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function send(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<Answer | null> {
  const headers: Record<string, string> = { [pageClientHeader]: pageClientVersion }
  if (body !== undefined) {
    headers['content-type'] = 'application/json'
  }
  try {
    const response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const payload = response.status === 204 ? null : await payloadOf(response)
    return { status: response.status, ok: response.ok, payload }
  } catch {
    return null
  }
}

function refusalCode(answer: Answer): string | null {
  const refusal = refusalSchema.safeParse(answer.payload)
  return refusal.success ? refusal.data.code : null
}

function isOutdatedAnswer(answer: Answer): boolean {
  const code = refusalCode(answer)
  if (answer.status === 409) {
    return code === outdatedClientCode
  }
  return (answer.status === 404 || answer.status === 405) && code === null
}

function failureOf(answer: Answer | null): { kind: 'failed' | 'outdated' } {
  return { kind: answer !== null && isOutdatedAnswer(answer) ? 'outdated' : 'failed' }
}

export const browserPageClient: PageClient = {
  async create() {
    const answer = await send('/mybook/entries', 'POST')
    const created = createdSchema.safeParse(answer?.payload)
    return answer?.ok === true && created.success
      ? { kind: 'created', id: created.data.id }
      : failureOf(answer)
  },
  async save(id, input) {
    const answer = await send(contentPath(id), 'PUT', input)
    const saved = savedSchema.safeParse(answer?.payload)
    return answer?.ok === true && saved.success
      ? { kind: 'saved', updatedAt: saved.data.updatedAt }
      : failureOf(answer)
  },
  async remove(id) {
    const answer = await send(contentPath(id), 'DELETE')
    if (answer?.ok === true || (answer?.status === 404 && refusalCode(answer) !== null)) {
      return 'removed'
    }
    return failureOf(answer).kind
  },
}
