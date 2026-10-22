import { describe, expect, it } from '@jest/globals'
import { bannedPhrasesIn, cogniBannedPhrases, mentionsContactCard } from './persona.ts'

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

  it('flags gendered endings in brackets', () => {
    expect(bannedPhrasesIn('Você não precisa ficar sozinho(a) nem cansado(a).')).toEqual([
      'sozinho(a)',
      'cansado(a)',
    ])
    expect(bannedPhrasesIn('Obrigada(o) por contar. Vocês estão cansados(as)?')).toEqual([
      'Obrigada(o)',
      'cansados(as)',
    ])
    expect(bannedPhrasesIn('Se sentir só depois do trabalho pesa (e muito).')).toEqual([])
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

describe('mentionsContactCard', () => {
  it('notices a reply that points to the contacts below', () => {
    expect(mentionsContactCard('Ligue para um dos contatos abaixo.')).toBe(true)
    expect(mentionsContactCard('The contacts below can help.')).toBe(true)
    expect(mentionsContactCard('Os contactos de apoio abaixo ajudam.')).toBe(true)
    expect(mentionsContactCard('Call one of the numbers listed below.')).toBe(true)
  })

  it('leaves other replies alone', () => {
    expect(mentionsContactCard('Você se sentiu pra baixo depois do trabalho.')).toBe(false)
    expect(mentionsContactCard('Teve contato com amigos e caminhou.')).toBe(false)
    expect(mentionsContactCard('O humor ficou um pouco abaixo da média.')).toBe(false)
    expect(mentionsContactCard('Your mood was below the usual level.')).toBe(false)
  })
})
