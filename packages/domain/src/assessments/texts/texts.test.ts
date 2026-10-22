import { describe, expect, it } from '@jest/globals'
import { locales } from '../../i18n/locales.ts'
import { gad7 } from '../gad7.ts'
import { instrumentIds } from '../instrument.ts'
import { phq9 } from '../phq9.ts'
import { instruments } from '../scoring.ts'
import { instrumentText } from './texts.ts'

describe('instrumentText', () => {
  it.each(locales)('gives every %s form one text per item', (locale) => {
    for (const id of instrumentIds) {
      const text = instrumentText(locale, id)
      expect(text.items).toHaveLength(instruments[id].itemCount)
      expect(text.options).toHaveLength(4)
      expect(text.prompt).not.toBe('')
    }
  })

  it.each(locales)('reuses the items of each full form for its %s screen', (locale) => {
    const full = instrumentText(locale, 'phq9').items
    expect(instrumentText(locale, 'phq2')).toEqual({
      ...instrumentText(locale, 'phq9'),
      items: [full[0], full[1], full[8]],
    })
    expect(instrumentText(locale, 'gad2').items).toEqual(
      instrumentText(locale, 'gad7').items.slice(0, 2),
    )
  })

  it('keeps the official wording of the self-harm item in each language', () => {
    const riskItem = phq9.riskItemIndex ?? -1

    expect(instrumentText('pt-BR', 'phq9').items[riskItem]).toBe(
      'Pensar em se ferir de alguma maneira ou que seria melhor estar morto/a',
    )
    expect(instrumentText('pt-PT', 'phq9').items[riskItem]).toBe(
      'Pensei que seria melhor estar morto/a, ou em magoar-me a mim próprio/a de alguma forma',
    )
    expect(instrumentText('en-US', 'phq9').items[riskItem]).toBe(
      'Thoughts that you would be better off dead or of hurting yourself in some way',
    )
  })

  it('uses the answer labels of each official translation', () => {
    expect(instrumentText('pt-BR', 'gad7').options[2]).toBe('Mais da metade dos dias')
    expect(instrumentText('pt-PT', 'gad7').options[2]).toBe('Em mais de metade do número de dias')
    expect(instrumentText('en-GB', 'gad7')).toEqual(instrumentText('en-US', 'gad7'))
    expect(instrumentText('en-US', gad7.id).options[0]).toBe('Not at all')
  })
})
