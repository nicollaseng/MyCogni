import type { ContentLanguage } from '../zen/content/types.ts'

export const narrationVoiceIds = ['jessica', 'hope', 'alexandra', 'mark'] as const

export type NarrationVoiceId = (typeof narrationVoiceIds)[number]

export type VoiceTone = 'warm' | 'bright' | 'natural' | 'relaxed'

export interface NarrationVoice {
  id: NarrationVoiceId
  name: string
  gender: 'female' | 'male'
  tone: VoiceTone
  providerVoiceId: string
}

export const narrationVoices: Readonly<Record<NarrationVoiceId, NarrationVoice>> = {
  jessica: {
    id: 'jessica',
    name: 'Jessica',
    gender: 'female',
    tone: 'warm',
    providerVoiceId: 'g6xIsTj2HwM6VR4iXFCw',
  },
  hope: {
    id: 'hope',
    name: 'Hope',
    gender: 'female',
    tone: 'bright',
    providerVoiceId: 'OYTbf65OHHFELVut7v2H',
  },
  alexandra: {
    id: 'alexandra',
    name: 'Alexandra',
    gender: 'female',
    tone: 'natural',
    providerVoiceId: 'kdmDKE6EkgrWrrykO9Qt',
  },
  mark: {
    id: 'mark',
    name: 'Mark',
    gender: 'male',
    tone: 'relaxed',
    providerVoiceId: '1SM7GgM6IMuvQlz2BwM3',
  },
}

export const narrationProvider = 'elevenlabs'

export const narrationRevision = 1

export interface NarrationModel {
  id: string
  languageCode: string
}

export const narrationModels: Readonly<Record<ContentLanguage, NarrationModel>> = {
  'pt-BR': { id: 'eleven_v4', languageCode: 'pt' },
  'pt-PT': { id: 'eleven_v4', languageCode: 'pt' },
  en: { id: 'eleven_v4', languageCode: 'en' },
}

const voicesByLanguage: Readonly<
  Record<ContentLanguage, readonly [NarrationVoiceId, ...NarrationVoiceId[]]>
> = {
  'pt-BR': ['jessica', 'hope', 'alexandra', 'mark'],
  'pt-PT': ['jessica', 'hope', 'alexandra', 'mark'],
  en: ['jessica', 'hope', 'alexandra', 'mark'],
}

export const narrationSpeeds = [0.9, 1, 1.1] as const

export type NarrationSpeed = (typeof narrationSpeeds)[number]

export const defaultNarrationSpeed: NarrationSpeed = 1

export function isNarrationVoiceId(value: unknown): value is NarrationVoiceId {
  return narrationVoiceIds.some((id) => id === value)
}

export function isNarrationSpeed(value: unknown): value is NarrationSpeed {
  return narrationSpeeds.some((speed) => speed === value)
}

export function voicesFor(language: ContentLanguage): readonly NarrationVoice[] {
  return voicesByLanguage[language].map((id) => narrationVoices[id])
}

export function defaultVoiceFor(language: ContentLanguage): NarrationVoiceId {
  return voicesByLanguage[language][0]
}

export function voiceFor(language: ContentLanguage, preferred: unknown): NarrationVoiceId {
  return isNarrationVoiceId(preferred) && voicesByLanguage[language].includes(preferred)
    ? preferred
    : defaultVoiceFor(language)
}
