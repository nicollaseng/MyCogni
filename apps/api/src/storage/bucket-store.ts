import { z } from 'zod'

export interface BucketStore {
  sign(paths: readonly string[]): Promise<Record<string, string>>
  remove(paths: readonly string[]): Promise<void>
}

export interface BucketStoreOptions {
  supabaseUrl: string
  secretKey: string
  bucket: string
  lifetimeSeconds: number
}

const signedSchema = z.array(
  z.object({ path: z.string().nullable(), signedURL: z.string().nullable() }),
)

export function createBucketStore({
  supabaseUrl,
  secretKey,
  bucket,
  lifetimeSeconds,
}: BucketStoreOptions): BucketStore {
  const headers = {
    apikey: secretKey,
    authorization: `Bearer ${secretKey}`,
    'content-type': 'application/json',
  }
  const base = `${supabaseUrl}/storage/v1`

  return {
    async sign(paths) {
      const unique = [...new Set(paths)]
      if (unique.length === 0) {
        return {}
      }
      const response = await fetch(`${base}/object/sign/${bucket}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expiresIn: lifetimeSeconds, paths: unique }),
      })
      if (!response.ok) {
        throw new Error(`Storage refused to sign ${bucket} files: ${String(response.status)}`)
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
      const response = await fetch(`${base}/object/${bucket}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ prefixes: paths }),
      })
      if (!response.ok) {
        throw new Error(`Storage refused to remove ${bucket} files: ${String(response.status)}`)
      }
    },
  }
}
