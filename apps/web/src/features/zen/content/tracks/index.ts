import type { TrackId } from '@mycogni/domain'
import type { ContentLanguage, TrackText, TrackTexts } from '../types'
import { englishTracks } from './en'
import { brazilianTracks } from './pt-br'
import { europeanTracks } from './pt-pt'

const tracksByLanguage: Readonly<Record<ContentLanguage, TrackTexts>> = {
  'pt-BR': brazilianTracks,
  'pt-PT': europeanTracks,
  en: englishTracks,
}

export function trackText(language: ContentLanguage, id: TrackId): TrackText {
  return tracksByLanguage[language][id]
}
