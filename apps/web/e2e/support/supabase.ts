import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const statusSchema = z.object({
  PUBLISHABLE_KEY: z.string(),
  SECRET_KEY: z.string(),
  SERVICE_ROLE_KEY: z.string(),
  MAILPIT_URL: z.url(),
  DB_URL: z.url(),
})

export type LocalSupabase = z.infer<typeof statusSchema>

const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url))

export const testEmailDomain = process.env.E2E_EMAIL_DOMAIN ?? 'e2e.mycogni.local'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:55321'

let cached: LocalSupabase | undefined

export function localSupabase(): LocalSupabase {
  cached ??= statusSchema.parse(
    JSON.parse(
      execFileSync('supabase', ['status', '-o', 'json'], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    ),
  )
  return cached
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@${testEmailDomain}`
}

function adminHeaders(): Record<string, string> {
  const key = localSupabase().SERVICE_ROLE_KEY
  return { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }
}

const createdSchema = z.object({ id: z.uuid() })
const usersSchema = z.object({ users: z.array(z.object({ id: z.uuid(), email: z.string() })) })

export async function createUser(
  email: string,
  password: string,
  confirmed = true,
): Promise<string> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ email, password, email_confirm: confirmed }),
  })
  if (!response.ok) {
    throw new Error(`Could not create ${email}: ${await response.text()}`)
  }
  return createdSchema.parse(await response.json()).id
}

const linkSchema = z.object({ hashed_token: z.string().min(1) })

export async function emailLinkTokenHash(
  type: 'signup' | 'recovery',
  email: string,
  password?: string,
): Promise<string> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ type, email, password }),
  })
  if (!response.ok) {
    throw new Error(`Could not create a ${type} link for ${email}: ${await response.text()}`)
  }
  return linkSchema.parse(await response.json()).hashed_token
}

export async function makeAdmin(id: string): Promise<void> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ app_metadata: { role: 'admin' } }),
  })
  if (!response.ok) {
    throw new Error(`Could not make ${id} an admin: ${await response.text()}`)
  }
}

export async function deleteUser(id: string): Promise<void> {
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })
}

export async function deleteTestUsers(): Promise<void> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
    headers: adminHeaders(),
  })
  const { users } = usersSchema.parse(await response.json())
  await Promise.all(
    users
      .filter((user) => user.email.endsWith(`@${testEmailDomain}`))
      .map((user) =>
        fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: adminHeaders(),
        }),
      ),
  )
}
