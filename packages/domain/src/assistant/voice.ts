import type { Locale } from '../i18n/locales.ts'

export const voiceLimits = {
  maxSeconds: 120,
  maxBytes: 5 * 1024 * 1024,
  hourlyTranscriptions: 40,
  dailyTranscriptions: 200,
} as const

export const voiceAudioTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'] as const

export type VoiceAudioType = (typeof voiceAudioTypes)[number]

export type TranscriptionLanguage = 'pt' | 'en'

export function voiceAudioTypeOf(contentType: string | null | undefined): VoiceAudioType | null {
  const base = (contentType ?? '').replace(/;.*$/s, '').trim().toLowerCase()
  return voiceAudioTypes.find((type) => type === base) ?? null
}

export function transcriptionLanguageOf(locale: Locale): TranscriptionLanguage {
  return locale.startsWith('pt') ? 'pt' : 'en'
}
