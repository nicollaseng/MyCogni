import { createSignedLinkCache, signedLinkWindow, type SignedLinkCache } from '@mycogni/domain'
import { z } from 'zod'

export interface BucketStore {
  sign(paths: readonly string[]): Promise<Record<string, string>>
  remove(paths: readonly string[]): Promise<void>
  removeFolder(folder: string): Promise<void>
}

export type LinkPolicy =
  | { kind: 'stable'; cache: SignedLinkCache; now: () => Date }
  | { kind: 'expiring'; lifetimeSeconds: number }

export interface BucketStoreOptions {
  supabaseUrl: string
  secretKey: string
  bucket: string
  links: LinkPolicy
}

const signedSchema = z.array(
  z.object({ path: z.string().nullable(), signedURL: z.string().nullable() }),
)

const listedSchema = z.array(z.object({ name: z.string(), id: z.string().nullable() }))

const listPageSize = 1000

const stableLinkCapacity = 5000

export function stableLinks(now: () => Date = () => new Date()): LinkPolicy {
  return { kind: 'stable', cache: createSignedLinkCache(stableLinkCapacity), now }
}

export function createBucketStore({
  supabaseUrl,
  secretKey,
  bucket,
  links,
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

  async function signNow(
    paths: readonly string[],
    expiresIn: number,
  ): Promise<Record<string, string>> {
    if (paths.length === 0) {
      return {}
    }
    const response = await fetch(`${base}/object/sign/${bucket}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ expiresIn, paths }),
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
  }

  async function sign(paths: readonly string[]): Promise<Record<string, string>> {
    const unique = [...new Set(paths)]
    if (links.kind === 'expiring') {
      return signNow(unique, links.lifetimeSeconds)
    }
    const window = signedLinkWindow(links.now())
    const known = Object.fromEntries(
      unique.flatMap((path) => {
        const url = links.cache.read(path, window)
        return url === undefined ? [] : [[path, url]]
      }),
    )
    const fresh = await signNow(
      unique.filter((path) => !Object.hasOwn(known, path)),
      window.expiresIn,
    )
    for (const [path, url] of Object.entries(fresh)) {
      links.cache.write(path, url, window)
    }
    return { ...known, ...fresh }
  }

  return {
    sign,
    remove,
    async removeFolder(folder) {
      await remove(await filesIn(folder))
    },
  }
}
