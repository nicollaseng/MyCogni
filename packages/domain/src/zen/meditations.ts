import { meditations } from './content/meditations/meditations.ts'
import type { MeditationText } from './content/meditations/types.ts'
import type { ContentLanguage } from './content/types.ts'
import type { MeditationId, MeditationLength } from './meditation-ids.ts'

export const meditationWordsPerMinute = 110

export interface MeditationSegment {
  index: number
  text: string
  pause: number
}

export function meditationText(id: MeditationId, language: ContentLanguage): MeditationText {
  return meditations[id].text[language]
}

export function meditationSegments(
  id: MeditationId,
  language: ContentLanguage,
  length: MeditationLength,
): MeditationSegment[] {
  const lines = meditationText(id, language).lines
  return meditations[id].plan.flatMap((plan, index) => {
    if (length === 'short' && plan.longOnly === true) {
      return []
    }
    return [
      {
        index,
        text: lines.slice(index, index + 1).join(''),
        pause: length === 'short' ? plan.pause : plan.longPause,
      },
    ]
  })
}

function wordsOf(text: string): number {
  return text.split(/\s+/u).filter((word) => word !== '').length
}

export function spokenSeconds(text: string): number {
  return (wordsOf(text) / meditationWordsPerMinute) * 60
}

export function meditationSeconds(
  id: MeditationId,
  language: ContentLanguage,
  length: MeditationLength,
): number {
  return Math.round(
    meditationSegments(id, language, length).reduce(
      (total, segment) => total + spokenSeconds(segment.text) + segment.pause,
      0,
    ),
  )
}

export function meditationMinutes(
  id: MeditationId,
  language: ContentLanguage,
  length: MeditationLength,
): number {
  return Math.max(1, Math.round(meditationSeconds(id, language, length) / 60))
}

export function meditationWords(id: MeditationId, language: ContentLanguage): number {
  return meditationText(id, language).lines.reduce((total, line) => total + wordsOf(line), 0)
}
