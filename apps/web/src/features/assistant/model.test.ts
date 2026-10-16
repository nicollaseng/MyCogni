import { describe, expect, it } from '@jest/globals'
import { paragraphsOf, showsAssistant, showsCrisisCard } from './model'
import { message } from './test-data'

describe('showsAssistant', () => {
  it('matches only Registros, the MyBook list and Padrões', () => {
    expect(['/entries', '/mybook', '/patterns'].every(showsAssistant)).toBe(true)
    expect(['/', '/today', '/mybook/abc', '/patterns/report', '/pro'].some(showsAssistant)).toBe(
      false,
    )
  })
})

describe('showsCrisisCard', () => {
  it('shows the crisis card only next to an urgent answer', () => {
    expect(showsCrisisCard(message('notice', 'Que bom que você me contou.', 'urgent'))).toBe(true)
    expect(showsCrisisCard(message('assistant', 'Fale com alguém agora.', 'urgent'))).toBe(true)
    expect(showsCrisisCard(message('assistant', 'ok', 'watch'))).toBe(false)
    expect(showsCrisisCard(message('assistant', 'ok'))).toBe(false)
    expect(showsCrisisCard(message('notice', 'sem resposta'))).toBe(false)
    expect(showsCrisisCard(message('user', 'quero morrer', 'urgent'))).toBe(false)
  })
})

describe('paragraphsOf', () => {
  it('splits on blank lines and drops empty ones', () => {
    expect(paragraphsOf('Um.\n\n\nDois.\nainda dois.\n\n ')).toEqual(['Um.', 'Dois.\nainda dois.'])
  })
})
