import {
  findNarration,
  meditationIds,
  meditationSegments,
  meditationText,
  spokenText,
  voicesFor,
  type ContentLanguage,
  type MeditationId,
  type MeditationLength,
  type NarrationManifest,
  type NarrationVoiceId,
  type TopicId,
  zenMeditations,
} from '@mycogni/domain'
import { narrationUrl } from '@/features/audio/narration'

export const narrationBytesPerSecond = 8000

export interface MeditationLine {
  index: number
  url: string
  seconds: number
}

export interface MeditationVoice {
  voice: NarrationVoiceId
  lines: readonly MeditationLine[]
}

export interface MeditationStep {
  index: number
  pause: number
}

export interface MeditationOption {
  id: MeditationId
  topic: TopicId
  title: string
  summary: string
  plans: Readonly<Record<MeditationLength, readonly MeditationStep[]>>
  minutes: Readonly<Record<MeditationLength, number>>
  voices: readonly MeditationVoice[]
}

function voiceLines(
  manifest: NarrationManifest,
  id: MeditationId,
  language: ContentLanguage,
  voice: NarrationVoiceId,
): MeditationLine[] | null {
  const lines: MeditationLine[] = []
  for (const segment of meditationSegments(id, language, 'long')) {
    const file = findNarration(manifest, { language, voice, text: spokenText(segment.text) })
    if (file === null) {
      return null
    }
    lines.push({
      index: segment.index,
      url: narrationUrl(file.path),
      seconds: file.bytes / narrationBytesPerSecond,
    })
  }
  return lines
}

export function planSeconds(
  plan: readonly MeditationStep[],
  lines: readonly MeditationLine[],
): number {
  return plan.reduce((total, step) => {
    const line = lines.find((candidate) => candidate.index === step.index)
    return total + (line?.seconds ?? 0) + step.pause
  }, 0)
}

export function meditationOptions(
  manifest: NarrationManifest,
  language: ContentLanguage,
): MeditationOption[] {
  return meditationIds.flatMap((id) => {
    const voices = voicesFor(language).flatMap(({ id: voice }) => {
      const lines = voiceLines(manifest, id, language, voice)
      return lines === null ? [] : [{ voice, lines }]
    })
    const first = voices[0]
    if (first === undefined) {
      return []
    }
    const text = meditationText(id, language)
    const steps = (length: MeditationLength): MeditationStep[] =>
      meditationSegments(id, language, length).map(({ index, pause }) => ({ index, pause }))
    const plans = { short: steps('short'), long: steps('long') }
    const minutesOf = (length: MeditationLength) =>
      Math.max(1, Math.round(planSeconds(plans[length], first.lines) / 60))
    const minutes = { short: minutesOf('short'), long: minutesOf('long') }
    return [
      {
        id,
        topic: zenMeditations[id].topic,
        title: text.title,
        summary: text.summary,
        plans,
        minutes,
        voices,
      },
    ]
  })
}
