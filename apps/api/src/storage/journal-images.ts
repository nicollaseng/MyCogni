import { journalBucket } from '@mycogni/domain'
import { z } from 'zod'

export interface JournalImageStore {
  sign(paths: readonly string[]): Promise<Record<string, string>>
  remove(paths: readonly string[]): Promise<void>
}

const signedSchema = z.array(
  z.object({ path: z.string().nullable(), signedURL: z.string().nullable() }),
)

const signedUrlLifetimeSeconds = 60 * 60

export function createJournalImageStore(supabaseUrl: string, secretKey: string): JournalImageStore {
  const headers = {
    apikey: secretKey,
    authorization: `Bearer ${secretKey}`,
    'content-type': 'application/json',
  }
  const base = `${supabaseUrl}/storage/v1`

  return {
    async sign(paths) {
      if (paths.length === 0) {
        return {}
      }
      const response = await fetch(`${base}/object/sign/${journalBucket}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expiresIn: signedUrlLifetimeSeconds, paths }),
      })
      if (!response.ok) {
        throw new Error(`Storage refused to sign images: ${String(response.status)}`)
      }
      const signed = signedSchema.parse(await response.json())
      return Object.fromEntries(
        signed.flatMap(({ path, signedURL }) =>
          path === null || signedURL === null ? [] : [[path, `${base}${signedURL}`]],
        ),
      )
    },
    async remove(paths) {
      if (paths.length === 0) {
        return
      }
      const response = await fetch(`${base}/object/${journalBucket}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ prefixes: paths }),
      })
      if (!response.ok) {
        throw new Error(`Storage refused to remove images: ${String(response.status)}`)
      }
    },
  }
}
