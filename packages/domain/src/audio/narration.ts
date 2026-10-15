import type { ContentLanguage } from '../zen/content/types.ts'
import type { NarrationKey } from '../zen/narration.ts'
import { contentHash } from './content-hash.ts'
import {
  narrationModels,
  narrationProvider,
  narrationRevision,
  narrationVoices,
  type NarrationVoiceId,
} from './voices.ts'

export const narrationBucket = 'narration'

export const narrationManifestPath = 'manifest.json'

export interface NarrationFile {
  path: string
  bytes: number
}

export interface NarrationManifest {
  version: 1
  files: Readonly<Record<string, NarrationFile>>
}

export const emptyNarrationManifest: NarrationManifest = { version: 1, files: {} }

export interface NarrationRequest {
  language: ContentLanguage
  voice: NarrationVoiceId
  text: string
}

export function narrationFingerprint({ language, voice, text }: NarrationRequest): string {
  const model = narrationModels[language]
  return contentHash(
    [
      narrationProvider,
      String(narrationRevision),
      model.id,
      model.languageCode,
      narrationVoices[voice].providerVoiceId,
      language,
      text,
    ].join('\u0000'),
  )
}

export function narrationPath(
  { language, voice }: Omit<NarrationRequest, 'text'>,
  key: NarrationKey,
  fingerprint: string,
): string {
  return `${language}/${voice}/${key.replaceAll('/', '--')}-${fingerprint}.mp3`
}

export function findNarration(
  manifest: NarrationManifest,
  request: NarrationRequest,
): NarrationFile | null {
  return manifest.files[narrationFingerprint(request)] ?? null
}
