import { z } from 'zod'

export interface AuthIdentity {
  provider: string
  data: Record<string, unknown>
}

export interface AuthAccount {
  identities: AuthIdentity[]
  appMetadata: Record<string, unknown>
}

export interface AccountAdmin {
  deleteUser(userId: string): Promise<void>
  findUser(userId: string): Promise<AuthAccount | null>
  updateAppMetadata(userId: string, metadata: Record<string, string>): Promise<void>
}

const metadataSchema = z.record(z.string(), z.unknown())

const userSchema = z.object({
  app_metadata: metadataSchema.nullish(),
  identities: z
    .array(z.object({ provider: z.string(), identity_data: metadataSchema.nullish() }))
    .nullish(),
})

const timeoutMs = 5000

export function createSupabaseAccountAdmin(supabaseUrl: string, secretKey: string): AccountAdmin {
  const userUrl = (userId: string) => `${supabaseUrl}/auth/v1/admin/users/${userId}`
  const headers = { apikey: secretKey, authorization: `Bearer ${secretKey}` }

  return {
    async deleteUser(userId) {
      const response = await fetch(userUrl(userId), {
        method: 'DELETE',
        headers: { apikey: secretKey },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error(`Supabase refused to delete the account: ${String(response.status)}`)
      }
    },
    async findUser(userId) {
      const response = await fetch(userUrl(userId), {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (response.status === 404) {
        return null
      }
      if (!response.ok) {
        throw new Error(`Supabase refused to read the account: ${String(response.status)}`)
      }
      const user = userSchema.parse(await response.json())
      return {
        appMetadata: user.app_metadata ?? {},
        identities: (user.identities ?? []).map((identity) => ({
          provider: identity.provider,
          data: identity.identity_data ?? {},
        })),
      }
    },
    async updateAppMetadata(userId, metadata) {
      const response = await fetch(userUrl(userId), {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ app_metadata: metadata }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) {
        throw new Error(`Supabase refused to update the account: ${String(response.status)}`)
      }
    },
  }
}
