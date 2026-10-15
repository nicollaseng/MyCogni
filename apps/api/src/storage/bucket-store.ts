import { z } from 'zod'

export interface BucketStore {
  upload(path: string, content: Uint8Array, contentType: string): Promise<void>
  sign(paths: readonly string[]): Promise<Record<string, string>>
  remove(paths: readonly string[]): Promise<void>
  removeFolder(folder: string): Promise<void>
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

const listedSchema = z.array(z.object({ name: z.string(), id: z.string().nullable() }))

const listPageSize = 1000

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

  async function listPage(prefix: string, offset: number) {
    const response = await fetch(`${base}/object/list/${bucket}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prefix, limit: listPageSize, offset }),
    })
    if (!response.ok) {
      throw new Error(`Storage refused to list ${bucket} files: ${String(response.status)}`)
    }
    return listedSchema.parse(await response.json())
  }

  async function filesIn(folder: string): Promise<string[]> {
    const paths: string[] = []
    for (let offset = 0; ; offset += listPageSize) {
      const page = await listPage(`${folder}/`, offset)
      for (const item of page) {
        const path = `${folder}/${item.name}`
        paths.push(...(item.id === null ? await filesIn(path) : [path]))
      }
      if (page.length < listPageSize) {
        return paths
      }
    }
  }

  async function remove(paths: readonly string[]) {
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
  }

  return {
    async upload(path, content, contentType) {
      const response = await fetch(`${base}/object/${bucket}/${path}`, {
        method: 'POST',
        headers: { ...headers, 'content-type': contentType, 'x-upsert': 'false' },
        body: new Blob([content], { type: contentType }),
      })
      if (!response.ok) {
        throw new Error(`Storage refused to store the ${bucket} file: ${String(response.status)}`)
      }
    },
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
    remove,
    async removeFolder(folder) {
      await remove(await filesIn(folder))
    },
  }
}
