import { readFile } from 'node:fs/promises'
import { narrationManifestSchema } from '@mycogni/contracts'
import {
  articleKey,
  articleNarration,
  narrationBucket,
  narrationFingerprint,
  narrationManifestPath,
  narrationPath,
  zenArticles,
  type ArticleId,
  type NarrationManifest,
} from '@mycogni/domain'
import { localSupabase, supabaseUrl } from './supabase'

function headers(contentType: string): Record<string, string> {
  const key = localSupabase().SECRET_KEY
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    'content-type': contentType,
    'x-upsert': 'true',
    'cache-control': 'max-age=0',
  }
}

async function store(
  path: string,
  body: Uint8Array<ArrayBuffer>,
  contentType: string,
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${narrationBucket}/${path}`, {
    method: 'POST',
    headers: headers(contentType),
    body: new Blob([body], { type: contentType }),
  })
  if (!response.ok) {
    throw new Error(`Storage answered ${String(response.status)}: ${await response.text()}`)
  }
}

async function storedManifest(): Promise<NarrationManifest> {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${narrationBucket}/${narrationManifestPath}`,
    { headers: headers('application/json') },
  )
  return response.ok
    ? narrationManifestSchema.parse(await response.json())
    : { version: 1, files: {} }
}

export async function publishArticleNarration(id: ArticleId, audioFile: string): Promise<string> {
  const text = articleNarration(zenArticles[id].text['pt-BR'])
  const fingerprint = narrationFingerprint({ language: 'pt-BR', voice: 'jessica', text })
  const path = narrationPath({ language: 'pt-BR', voice: 'jessica' }, articleKey(id), fingerprint)
  const audio = await readFile(audioFile)
  await store(path, Uint8Array.from(audio), 'audio/mpeg')
  const manifest = await storedManifest()
  const next: NarrationManifest = {
    version: 1,
    files: { ...manifest.files, [fingerprint]: { path, bytes: audio.byteLength } },
  }
  await store(
    narrationManifestPath,
    new TextEncoder().encode(JSON.stringify(next)),
    'application/json',
  )
  return path
}
