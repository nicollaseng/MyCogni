import { randomUUID } from 'node:crypto'
import { z } from 'zod'

export interface TestUser {
  id: string
  email: string
  accessToken: string
}

const createdUserSchema = z.object({ id: z.uuid() })
const sessionSchema = z.object({ access_token: z.string() })

export const testSupabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:55321'

export const testMailpitUrl = process.env.MAILPIT_URL ?? 'http://127.0.0.1:55324'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    throw new Error(`${name} is missing. Start the local stack with pnpm db:start.`)
  }
  return value
}

async function request(path: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(`${testSupabaseUrl}${path}`, init)
  if (!response.ok) {
    throw new Error(
      `Supabase ${path} answered ${String(response.status)}: ${await response.text()}`,
    )
  }
  return response.status === 204 ? null : response.json()
}

function adminHeaders(): Record<string, string> {
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  return { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }
}

export async function createTestUser(metadata: Record<string, string> = {}): Promise<TestUser> {
  const email = `${randomUUID()}@test.mycogni.local`
  const password = randomUUID()
  const created = createdUserSchema.parse(
    await request('/auth/v1/admin/users', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
    }),
  )
  const session = sessionSchema.parse(
    await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: requiredEnv('SUPABASE_ANON_KEY'), 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  )
  return { id: created.id, email, accessToken: session.access_token }
}

export async function deleteTestUser(id: string): Promise<void> {
  await request(`/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: adminHeaders() })
}

export function bearer(user: TestUser): Record<string, string> {
  return { authorization: `Bearer ${user.accessToken}` }
}
