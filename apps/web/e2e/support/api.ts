import { randomUUID } from 'node:crypto'
import { requiredConsentKinds, sharingConsentVersion, type MemoryKind } from '@mycogni/domain'
import { z } from 'zod'
import {
  createUser,
  deleteUser,
  localSupabase,
  makeAdmin,
  supabaseUrl,
  uniqueEmail,
} from './supabase'

export const apiUrl =
  process.env.API_URL ?? `http://127.0.0.1:${process.env.E2E_API_PORT ?? '3333'}`

const sessionSchema = z.object({ access_token: z.string(), user: z.object({ id: z.uuid() }) })

interface Session {
  token: string
  userId: string
}

async function signedSession(email: string, password: string): Promise<Session> {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: localSupabase().PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const session = sessionSchema.parse(await response.json())
  return { token: session.access_token, userId: session.user.id }
}

async function accessToken(email: string, password: string): Promise<string> {
  return (await signedSession(email, password)).token
}

export const tinyPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
)

async function storeFile(
  { token, userId }: Session,
  bucket: string,
  extension: string,
  contentType: string,
  body: Buffer,
): Promise<string> {
  const path = `${userId}/${randomUUID()}.${extension}`
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: localSupabase().PUBLISHABLE_KEY,
      authorization: `Bearer ${token}`,
      'content-type': contentType,
    },
    body: Uint8Array.from(body),
  })
  if (!response.ok) {
    throw new Error(`Storage answered ${String(response.status)}: ${await response.text()}`)
  }
  return path
}

async function send(
  { token }: Session,
  method: 'POST' | 'PATCH' | 'PUT',
  path: string,
  body: unknown,
): Promise<void> {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(
      `${method} ${path} answered ${String(response.status)}: ${await response.text()}`,
    )
  }
}

export async function sendRegistrationDocument(email: string, password: string): Promise<void> {
  const session = await signedSession(email, password)
  const path = await storeFile(session, 'professional-documents', 'pdf', 'application/pdf', tinyPdf)
  await send(session, 'POST', '/v1/professional/documents', {
    path,
    fileName: 'Carteira CRP.pdf',
    contentType: 'application/pdf',
    sizeBytes: tinyPdf.length,
  })
}

export async function setPhoto(email: string, password: string, photo: Buffer): Promise<void> {
  const session = await signedSession(email, password)
  const path = await storeFile(session, 'avatars', 'png', 'image/png', photo)
  await send(session, 'PATCH', '/v1/me', { avatarPath: path })
}

async function poster(email: string, password: string) {
  const authorization = `Bearer ${await accessToken(email, password)}`
  return async function post(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers:
        body === undefined
          ? { authorization }
          : { authorization, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`POST ${path} answered ${String(response.status)}: ${await response.text()}`)
    }
    return response.status === 204 ? null : response.json()
  }
}

export async function rename(email: string, password: string, displayName: string): Promise<void> {
  const response = await fetch(`${apiUrl}/v1/me`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${await accessToken(email, password)}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ displayName }),
  })
  if (!response.ok) {
    throw new Error(`PATCH /v1/me answered ${String(response.status)}: ${await response.text()}`)
  }
}

export async function setTimeZone(
  email: string,
  password: string,
  timezone: string,
): Promise<void> {
  const response = await fetch(`${apiUrl}/v1/me`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${await accessToken(email, password)}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ timezone }),
  })
  if (!response.ok) {
    throw new Error(`PATCH /v1/me answered ${String(response.status)}: ${await response.text()}`)
  }
}

export async function finishOnboarding(email: string, password: string): Promise<void> {
  const post = await poster(email, password)

  await post('/v1/consents', { kinds: requiredConsentKinds })
  await post('/v1/assessments', { instrument: 'phq9', answers: Array.from({ length: 9 }, () => 0) })
  await post('/v1/assessments', { instrument: 'gad7', answers: Array.from({ length: 7 }, () => 0) })
  await post('/v1/onboarding/complete')
}

export async function answerQuestionnaires(
  email: string,
  password: string,
  phq9: readonly number[],
  gad7: readonly number[],
): Promise<void> {
  const post = await poster(email, password)
  await post('/v1/assessments', { instrument: 'phq9', answers: phq9 })
  await post('/v1/assessments', { instrument: 'gad7', answers: gad7 })
}

export interface CheckInSeed {
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
}

const createdSchema = z.object({ id: z.uuid() })

export async function recordCheckIns(
  email: string,
  password: string,
  checkIns: readonly CheckInSeed[],
): Promise<string[]> {
  const post = await poster(email, password)
  const ids: string[] = []
  for (const checkIn of checkIns) {
    ids.push(createdSchema.parse(await post('/v1/check-ins', checkIn)).id)
  }
  return ids
}

export async function addToCheckIn(
  email: string,
  password: string,
  checkInId: string,
  text: string,
): Promise<void> {
  const post = await poster(email, password)
  await post(`/v1/check-ins/${checkInId}/addenda`, { text })
}

export async function registeredProfessional(
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const userId = await createUser(email, password, { accountType: 'professional' })
  const register = await poster(email, password)
  await register('/v1/professional', {
    kind: 'psychologist',
    fullName,
    registration: 'CRP 06/123456',
  })
  return userId
}

export async function verifiedProfessional(
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const userId = await registeredProfessional(email, password, fullName)
  await sendRegistrationDocument(email, password)
  const adminEmail = uniqueEmail('admin')
  const adminId = await createUser(adminEmail, password)
  await makeAdmin(adminId)
  const review = await poster(adminEmail, password)
  await review(`/v1/admin/professionals/${userId}/review`, {
    status: 'verified',
  })
  await deleteUser(adminId)
  return userId
}

const claimedSchema = z.object({ id: z.uuid() })

const createdInvitationSchema = z.object({
  invitation: z.object({ code: z.string(), link: z.url() }),
})

export async function inviteByLink(
  email: string,
  password: string,
): Promise<{ code: string; link: string }> {
  const post = await poster(email, password)
  return createdInvitationSchema.parse(
    await post('/v1/invitations', { channel: 'link', locale: 'pt-BR' }),
  ).invitation
}

export async function claimInvitation(
  email: string,
  password: string,
  code: string,
): Promise<void> {
  const post = await poster(email, password)
  await post('/v1/invitations/claim', { code })
}

export async function allowSummaries(email: string, password: string): Promise<void> {
  const post = await poster(email, password)
  await post('/v1/consents', { kinds: ['ai_processing'] })
}

const careLinksSchema = z.array(z.object({ id: z.uuid() }))

export async function confirmSharingTerms(email: string, password: string): Promise<void> {
  const session = await signedSession(email, password)
  const response = await fetch(`${apiUrl}/v1/care-links`, {
    headers: { authorization: `Bearer ${session.token}` },
  })
  for (const { id } of careLinksSchema.parse(await response.json())) {
    await send(session, 'POST', `/v1/care-links/${id}/terms`, {
      consentVersion: sharingConsentVersion,
    })
  }
}

export async function acceptInvitation(
  email: string,
  password: string,
  code: string,
): Promise<void> {
  const post = await poster(email, password)
  const { id } = claimedSchema.parse(await post('/v1/invitations/claim', { code }))
  await post(`/v1/invitations/${id}/accept`, {
    sharesHistory: true,
    consentVersion: sharingConsentVersion,
  })
}

export interface MemorySeed {
  content: string
  kind?: MemoryKind
}

export async function addMemories(
  email: string,
  password: string,
  memories: readonly (string | MemorySeed)[],
): Promise<void> {
  const post = await poster(email, password)
  for (const memory of memories) {
    await post('/v1/memories', typeof memory === 'string' ? { content: memory } : memory)
  }
}

export async function shareWholeJournal(email: string, password: string): Promise<void> {
  const session = await signedSession(email, password)
  const response = await fetch(`${apiUrl}/v1/care-links`, {
    headers: { authorization: `Bearer ${session.token}` },
  })
  for (const { id } of careLinksSchema.parse(await response.json())) {
    await send(session, 'POST', '/v1/journal/shares', {
      careLinkId: id,
      scope: 'all',
      expiresAt: null,
    })
  }
}

export interface ReminderSeed {
  enabled: boolean
  time: string
  days: number[]
  push: boolean
  email: boolean
}

export async function setReminders(
  email: string,
  password: string,
  settings: ReminderSeed,
): Promise<void> {
  await send(await signedSession(email, password), 'PUT', '/v1/reminders', settings)
}

export interface PracticeSeed {
  kind: 'meditation' | 'breathing' | 'sound' | 'reading'
  contentId: string
  seconds: number
  completed: boolean
  feelingAfter?: number | null
  startedAt?: string
}

export async function recordPractice(
  email: string,
  password: string,
  sessions: readonly PracticeSeed[],
): Promise<void> {
  const post = await poster(email, password)
  for (const session of sessions) {
    await post('/v1/zen/sessions', { startedAt: new Date().toISOString(), ...session })
  }
}
