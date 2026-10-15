import { describe, expect, it } from '@jest/globals'
import { createTranslator } from 'next-intl'
import { messagesFor } from '.'

function stringsOf(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(stringsOf)
  }
  return []
}

function occurrences(text: string, part: string): number {
  return text.split(part).length - 1
}

describe('Brazilian Portuguese plurals', () => {
  const t = createTranslator({ locale: 'pt-BR', messages: messagesFor('pt-BR') })

  it('reads zero in the plural and one in the singular', () => {
    expect(t('patterns.frequent.count', { count: 0 })).toBe('0 registros')
    expect(t('patterns.frequent.count', { count: 1 })).toBe('1 registro')
    expect(t('patterns.weekdays.days', { count: 0 })).toBe('0 dias')
    expect(t('entries.results.all', { count: 0 })).toBe('0 registros')
  })

  it('gives every plural an explicit zero', () => {
    const missing = stringsOf(messagesFor('pt-BR')).filter(
      (message) => occurrences(message, ', plural, ') !== occurrences(message, ', plural, =0 {'),
    )

    expect(missing).toEqual([])
  })
})
