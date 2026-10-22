import { describe, expect, it } from '@jest/globals'
import { transcriptionLanguageOf, voiceAudioTypeOf, voiceLimits } from './voice.ts'

describe('voice messages', () => {
  it('keeps a recording to two minutes and five megabytes', () => {
    expect(voiceLimits.maxSeconds).toBe(120)
    expect(voiceLimits.maxBytes).toBe(5_242_880)
  })

  it.each([
    ['audio/webm;codecs=opus', 'audio/webm'],
    ['audio/mp4', 'audio/mp4'],
    ['Audio/MP4; codecs="mp4a.40.2"', 'audio/mp4'],
    ['audio/ogg; codecs=opus', 'audio/ogg'],
  ])('accepts %p as %p', (contentType, type) => {
    expect(voiceAudioTypeOf(contentType)).toBe(type)
  })

  it.each([['audio/wav'], ['video/webm'], ['application/json'], [''], [null], [undefined]])(
    'refuses %p',
    (contentType) => {
      expect(voiceAudioTypeOf(contentType)).toBeNull()
    },
  )

  it('asks for Portuguese or English from the locale', () => {
    expect(transcriptionLanguageOf('pt-BR')).toBe('pt')
    expect(transcriptionLanguageOf('pt-PT')).toBe('pt')
    expect(transcriptionLanguageOf('en-US')).toBe('en')
    expect(transcriptionLanguageOf('en-GB')).toBe('en')
  })
})
