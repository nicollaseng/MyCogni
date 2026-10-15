import { describe, expect, it } from '@jest/globals'
import { needsSupport, paragraphsOf, showsAssistant } from './model'
import { message } from './test-data'

describe('showsAssistant', () => {
  it('matches only Registros, the MyBook list and Padrões', () => {
    expect(['/entries', '/mybook', '/patterns'].every(showsAssistant)).toBe(true)
    expect(['/', '/today', '/mybook/abc', '/patterns/report', '/pro'].some(showsAssistant)).toBe(
      false,
    )
  })
})

describe('needsSupport', () => {
  it('offers support after risky answers and, for the person, after every notice', () => {
    expect(needsSupport(message('assistant', 'ok'), 'personal')).toBe(false)
    expect(needsSupport(message('assistant', 'ok', 'watch'), 'personal')).toBe(true)
    expect(needsSupport(message('notice', 'sem resposta'), 'personal')).toBe(true)
    expect(needsSupport(message('notice', 'sem resposta'), 'professional')).toBe(false)
    expect(needsSupport(message('user', 'quero morrer', 'urgent'), 'personal')).toBe(false)
  })
})

describe('paragraphsOf', () => {
  it('splits on blank lines and drops empty ones', () => {
    expect(paragraphsOf('Um.\n\n\nDois.\nainda dois.\n\n ')).toEqual(['Um.', 'Dois.\nainda dois.'])
  })
})
