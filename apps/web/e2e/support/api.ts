import { requiredConsentKinds } from '@mycogni/domain'
import { z } from 'zod'
import {
  createUser,
  deleteUser,
  localSupabase,
  makeAdmin,
  supabaseUrl,
  uniqueEmail,
} from './supabase'

const apiUrl = process.env.API_URL ?? `http://127.0.0.1:${process.env.E2E_API_PORT ?? '3333'}`

const sessionSchema = z.object({ access_token: z.string() })

async function accessToken(email: string, password: string): Promise<string> {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: localSupabase().PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return sessionSchema.parse(await response.json()).access_token
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

export async function finishOnboarding(email: string, password: string): Promise<void> {
  const post = await poster(email, password)

  await post('/v1/consents', { kinds: requiredConsentKinds })
  await post('/v1/assessments', { instrument: 'phq9', answers: Array.from({ length: 9 }, () => 0) })
  await post('/v1/assessments', { instrument: 'gad7', answers: Array.from({ length: 7 }, () => 0) })
  await post('/v1/onboarding/complete')
}

export async function verifiedProfessional(
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const userId = await createUser(email, password)
  const register = await poster(email, password)
  await register('/v1/professional', {
    kind: 'psychologist',
    fullName,
    registration: 'CRP 06/123456',
  })
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
