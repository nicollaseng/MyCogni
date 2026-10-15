import { describe, expect, it } from '@jest/globals'
import {
  defaultNarrationSpeed,
  defaultVoiceFor,
  isNarrationSpeed,
  isNarrationVoiceId,
  narrationModels,
  narrationVoiceIds,
  narrationVoices,
  voiceFor,
  voicesFor,
} from './voices.ts'

describe('narration voices', () => {
  it('reads with a female voice by default in every language and offers alternatives', () => {
    for (const language of ['pt-BR', 'pt-PT', 'en'] as const) {
      expect(narrationVoices[defaultVoiceFor(language)].gender).toBe('female')
      const voices = voicesFor(language)
      expect(voices.length).toBeGreaterThanOrEqual(3)
      expect(voices.length).toBeLessThanOrEqual(4)
      expect(narrationModels[language].id).not.toBe('')
    }
  })

  it('keeps one provider voice per catalog voice', () => {
    for (const id of narrationVoiceIds) {
      expect(narrationVoices[id].id).toBe(id)
      expect(narrationVoices[id].providerVoiceId).toMatch(/^[A-Za-z0-9]{20}$/)
    }
    const providerIds = narrationVoiceIds.map((id) => narrationVoices[id].providerVoiceId)
    expect(new Set(providerIds).size).toBe(providerIds.length)
  })

  it('honours a valid preference and falls back to the default otherwise', () => {
    expect(voiceFor('pt-BR', 'mark')).toBe('mark')
    expect(voiceFor('pt-BR', 'rachel')).toBe(defaultVoiceFor('pt-BR'))
    expect(voiceFor('en', null)).toBe(defaultVoiceFor('en'))
    expect(isNarrationVoiceId('hope')).toBe(true)
    expect(isNarrationVoiceId(7)).toBe(false)
  })

  it('reads at a normal speed unless a slower or faster one is chosen', () => {
    expect(defaultNarrationSpeed).toBe(1)
    expect(isNarrationSpeed(0.9)).toBe(true)
    expect(isNarrationSpeed(1.5)).toBe(false)
  })
})
