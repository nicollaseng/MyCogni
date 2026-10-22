import {
  contentLanguageOf,
  findNarration,
  previewNarrationItem,
  voicesFor,
  type NarrationVoiceId,
} from '@mycogni/domain'
import { getLocale } from 'next-intl/server'
import { fetchNarrationManifest, narrationUrl } from '@/features/audio/narration'

export async function voicePreviews(): Promise<Partial<Record<NarrationVoiceId, string>>> {
  const [locale, manifest] = await Promise.all([getLocale(), fetchNarrationManifest()])
  const language = contentLanguageOf(locale)
  const { text } = previewNarrationItem(language)
  return Object.fromEntries(
    voicesFor(language).flatMap((voice) => {
      const file = findNarration(manifest, { language, voice: voice.id, text })
      return file === null ? [] : [[voice.id, narrationUrl(file.path)]]
    }),
  )
}
