import type { TranscriptionLanguage } from '@mycogni/domain'
import type { Transcriber } from './transcriber.ts'

export const scriptedTranscriptions: Readonly<Record<TranscriptionLanguage, string>> = {
  pt: 'Hoje eu acordei cansado e com a cabeça cheia.',
  en: 'I woke up tired today and my head feels full.',
}

export function createScriptedTranscriber(): Transcriber {
  return {
    transcribe: ({ language }) => Promise.resolve(scriptedTranscriptions[language]),
  }
}
