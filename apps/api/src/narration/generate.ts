import {
  defaultVoiceFor,
  narrationFingerprint,
  narrationItems,
  narrationModels,
  narrationPath,
  narrationVoices,
  voicesFor,
  type ContentLanguage,
  type NarrationItem,
  type NarrationManifest,
  type NarrationVoiceId,
} from '@mycogni/domain'
import type { NarrationStore } from './narration-store.ts'
import type { SpeechProvider } from './provider.ts'

export type VoiceSelection = 'default' | 'all' | readonly NarrationVoiceId[]

export interface NarrationJob {
  language: ContentLanguage
  voice: NarrationVoiceId
  item: NarrationItem
  fingerprint: string
  path: string
}

function voicesToRender(
  language: ContentLanguage,
  item: NarrationItem,
  selection: VoiceSelection,
): NarrationVoiceId[] {
  const available = voicesFor(language).map((voice) => voice.id)
  if (selection === 'all' || item.key === 'preview') {
    return available
  }
  if (selection === 'default') {
    return [defaultVoiceFor(language)]
  }
  return available.filter((voice) => selection.includes(voice))
}

export function planNarration(
  manifest: NarrationManifest,
  languages: readonly ContentLanguage[],
  selection: VoiceSelection,
): NarrationJob[] {
  const jobs = new Map<string, NarrationJob>()
  for (const language of languages) {
    for (const item of narrationItems(language)) {
      for (const voice of voicesToRender(language, item, selection)) {
        const fingerprint = narrationFingerprint({ language, voice, text: item.text })
        if (manifest.files[fingerprint] === undefined && !jobs.has(fingerprint)) {
          jobs.set(fingerprint, {
            language,
            voice,
            item,
            fingerprint,
            path: narrationPath({ language, voice }, item.key, fingerprint),
          })
        }
      }
    }
  }
  return [...jobs.values()]
}

export function charactersOf(jobs: readonly NarrationJob[]): number {
  return jobs.reduce((total, job) => total + job.item.text.length, 0)
}

interface RenderOptions {
  jobs: readonly NarrationJob[]
  manifest: NarrationManifest
  provider: SpeechProvider
  store: NarrationStore
  report: (message: string) => void
}

export async function renderNarration({
  jobs,
  manifest,
  provider,
  store,
  report,
}: RenderOptions): Promise<NarrationManifest> {
  let current = manifest
  for (const [index, job] of jobs.entries()) {
    const model = narrationModels[job.language]
    const audio = await provider.synthesize({
      text: job.item.text,
      voiceId: narrationVoices[job.voice].providerVoiceId,
      modelId: model.id,
      languageCode: model.languageCode,
    })
    await store.upload(job.path, audio)
    current = {
      version: 1,
      files: { ...current.files, [job.fingerprint]: { path: job.path, bytes: audio.byteLength } },
    }
    await store.writeManifest(current)
    report(`${String(index + 1)}/${String(jobs.length)} ${job.path}`)
  }
  return current
}
