import { narrationManifestSchema } from '@mycogni/contracts'
import {
  emptyNarrationManifest,
  narrationBucket,
  narrationManifestPath,
  type NarrationManifest,
} from '@mycogni/domain'

export interface NarrationStore {
  readManifest(): Promise<NarrationManifest>
  writeManifest(manifest: NarrationManifest): Promise<void>
  upload(path: string, audio: Uint8Array): Promise<void>
}

interface NarrationStoreOptions {
  supabaseUrl: string
  secretKey: string
}

const audioCache = 'max-age=31536000'

const manifestCache = 'max-age=60'

export function createNarrationStore({
  supabaseUrl,
  secretKey,
}: NarrationStoreOptions): NarrationStore {
  const base = `${supabaseUrl}/storage/v1/object/${narrationBucket}`
  const auth = { apikey: secretKey, authorization: `Bearer ${secretKey}` }

  async function put(path: string, body: Blob, cacheControl: string): Promise<void> {
    const response = await fetch(`${base}/${path}`, {
      method: 'POST',
      headers: {
        ...auth,
        'content-type': body.type,
        'cache-control': cacheControl,
        'x-upsert': 'true',
      },
      body,
    })
    if (!response.ok) {
      throw new Error(
        `Storage refused to store ${path}: ${String(response.status)} ${await response.text()}`,
      )
    }
  }

  return {
    async readManifest() {
      const response = await fetch(`${base}/${narrationManifestPath}`, { headers: auth })
      if (response.status === 400 || response.status === 404) {
        return emptyNarrationManifest
      }
      if (!response.ok) {
        throw new Error(`Storage refused to read the manifest: ${String(response.status)}`)
      }
      return narrationManifestSchema.parse(await response.json())
    },
    writeManifest(manifest) {
      return put(
        narrationManifestPath,
        new Blob([JSON.stringify(manifest)], { type: 'application/json' }),
        manifestCache,
      )
    },
    upload(path, audio) {
      return put(path, new Blob([audio], { type: 'audio/mpeg' }), audioCache)
    },
  }
}
