import { describe, expect, it } from '@jest/globals'
import { bindShortWords } from './text'

describe('bindShortWords', () => {
  it('keeps one-letter words with the next word so a line never ends on them', () => {
    expect(bindShortWords('Caminhei antes do trabalho e o dia rendeu.')).toBe(
      'Caminhei antes do trabalho e\u00a0o\u00a0dia rendeu.',
    )
  })

  it('works at the start, after punctuation and with accented letters', () => {
    expect(bindShortWords('A caminhada (e o sono) ajudaram, é verdade')).toBe(
      'A\u00a0caminhada (e\u00a0o\u00a0sono) ajudaram, é\u00a0verdade',
    )
  })

  it('keeps line breaks and longer words as they are', () => {
    expect(bindShortWords('Dia bom\nfoi ótimo')).toBe('Dia bom\nfoi ótimo')
    expect(bindShortWords('o\nfim')).toBe('o\nfim')
  })
})
