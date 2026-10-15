import { narrationManifestSchema } from '@mycogni/contracts'
import {
  emptyNarrationManifest,
  findNarration,
  narrationBucket,
  narrationManifestPath,
  voicesFor,
  type ContentLanguage,
  type NarrationManifest,
  type NarrationVoiceId,
} from '@mycogni/domain'
import { publicEnv } from '@/shared/lib/env'

export interface NarrationSource {
  voice: NarrationVoiceId
  url: string
}

export const narrationRevalidateSeconds = 60

export function narrationUrl(path: string): string {
  return `${publicEnv().supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${narrationBucket}/${path}`
}

export async function fetchNarrationManifest(): Promise<NarrationManifest> {
  try {
    const response = await fetch(narrationUrl(narrationManifestPath), {
      next: { revalidate: narrationRevalidateSeconds },
    })
    if (!response.ok) {
      return emptyNarrationManifest
    }
    const parsed = narrationManifestSchema.safeParse(await response.json())
    return parsed.success ? parsed.data : emptyNarrationManifest
  } catch {
    return emptyNarrationManifest
  }
}

export function narrationSources(
  manifest: NarrationManifest,
  language: ContentLanguage,
  text: string,
): NarrationSource[] {
  return voicesFor(language).flatMap((voice) => {
    const file = findNarration(manifest, { language, voice: voice.id, text })
    return file === null ? [] : [{ voice: voice.id, url: narrationUrl(file.path) }]
  })
}
