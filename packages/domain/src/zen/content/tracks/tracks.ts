import type { TrackId } from '../../catalog.ts'
import type { ContentLanguage, TrackText, TrackTexts } from '../types.ts'
import { englishTracks } from './en.ts'
import { brazilianTracks } from './pt-br.ts'
import { europeanTracks } from './pt-pt.ts'

const tracksByLanguage: Readonly<Record<ContentLanguage, TrackTexts>> = {
  'pt-BR': brazilianTracks,
  'pt-PT': europeanTracks,
  en: englishTracks,
}

export function trackText(language: ContentLanguage, id: TrackId): TrackText {
  return tracksByLanguage[language][id]
}
