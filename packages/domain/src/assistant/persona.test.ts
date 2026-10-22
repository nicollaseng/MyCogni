import { describe, expect, it } from '@jest/globals'
import { bannedPhrasesIn, cogniBannedPhrases } from './persona.ts'

describe('bannedPhrasesIn', () => {
  it('finds banned phrases regardless of case and accents', () => {
    expect(bannedPhrasesIn('Ótima pergunta! Vamos NAVEGAR juntos nessa jornada.')).toEqual([
      'ótima pergunta',
      'navegar',
      'jornada',
    ])
    expect(bannedPhrasesIn('Great question. As an AI, I’m here to help.')).toEqual([
      'as an AI',
      'great question',
      'I’m here to help',
    ])
  })

  it('matches whole words only', () => {
    expect(bannedPhrasesIn('A navegação do app e as jornadas de trabalho.')).toEqual([])
    expect(bannedPhrasesIn('Faz sentido. O que acha de uma pausa curta?')).toEqual([])
  })

  it('lists every phrase it checks', () => {
    for (const phrase of cogniBannedPhrases) {
      expect(bannedPhrasesIn(`antes ${phrase} depois`)).toContain(phrase)
    }
  })
})
