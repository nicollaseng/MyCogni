import { requiredConsentKinds } from '@mycogni/domain'
import { z } from 'zod'
import { localSupabase, supabaseUrl } from './supabase'

const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:3333'

const sessionSchema = z.object({ access_token: z.string() })

async function accessToken(email: string, password: string): Promise<string> {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: localSupabase().PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return sessionSchema.parse(await response.json()).access_token
}

export async function finishOnboarding(email: string, password: string): Promise<void> {
  const authorization = `Bearer ${await accessToken(email, password)}`

  async function post(path: string, body?: unknown): Promise<void> {
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
  }

  await post('/v1/consents', { kinds: requiredConsentKinds })
  await post('/v1/assessments', { instrument: 'phq9', answers: Array.from({ length: 9 }, () => 0) })
  await post('/v1/assessments', { instrument: 'gad7', answers: Array.from({ length: 7 }, () => 0) })
  await post('/v1/onboarding/complete')
}
