import { describe, expect, it } from '@jest/globals'
import { locales } from '../../i18n/locales.ts'
import { catalogEntryOf, questionnaireVariants, type QuestionnaireVariant } from '../catalog.ts'
import { questionnaireForms } from '../forms.ts'
import { questionnaireText, textLocaleOf } from './texts.ts'

describe('questionnaire texts', () => {
  it('has one official item per question and the scored values as options', () => {
    for (const variant of questionnaireVariants) {
      for (const locale of locales) {
        const text = questionnaireText(variant, locale)
        if (text === null) {
          continue
        }
        expect(text.items).toHaveLength(catalogEntryOf(variant).itemCount)
        expect(text.options.map((option) => option.value).sort()).toEqual(
          [...questionnaireForms[variant].values].sort(),
        )
        expect(text.lead).not.toBe('')
        expect(text.instructions).toContain(text.lead.slice(0, 20))
        expect(text.source.retrievedOn).toBe('2026-10-22')
        for (const item of text.standaloneItems) {
          expect(text.items[item]).toBeDefined()
        }
      }
    }
  })

  it('ships only the languages that have an official text', () => {
    const shipped = (variant: QuestionnaireVariant) =>
      locales.filter((locale) => questionnaireText(variant, locale) !== null)
    for (const variant of ['phq9', 'phq8', 'gad7', 'asrs6'] as const) {
      expect(shipped(variant)).toEqual([...locales])
    }
    expect(shipped('pcl5')).toEqual(['pt-BR', 'en-US', 'en-GB'])
    expect(shipped('k10')).toEqual(['pt-BR', 'en-US', 'en-GB'])
    expect(shipped('k6')).toEqual(['en-US', 'en-GB'])
    expect(questionnaireText('pcl5', 'pt-PT')).toBeNull()
    expect(questionnaireText('k6', 'pt-BR')).toBeNull()
  })

  it('uses the English text for both English locales', () => {
    expect(textLocaleOf('en-GB')).toBe('en')
    expect(textLocaleOf('en-US')).toBe('en')
    expect(textLocaleOf('pt-PT')).toBe('pt-PT')
    expect(questionnaireText('k10', 'en-GB')).toBe(questionnaireText('k10', 'en-US'))
  })

  it('keeps the official Brazilian PHQ-9 wording and spelling', () => {
    const text = questionnaireText('phq9', 'pt-BR')
    expect(text?.lead).toBe(
      'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a por qualquer um dos problemas abaixo?',
    )
    expect(text?.items[7]).toContain('Ou o oposto – estar')
    expect(text?.options.map((option) => option.label)).toEqual([
      'Nenhuma vez',
      'Vários dias',
      'Mais da metade dos dias',
      'Quase todos os dias',
    ])
  })

  it('derives the PHQ-8 from the PHQ-9 translation without the self-harm item', () => {
    for (const locale of ['pt-BR', 'pt-PT', 'en-US'] as const) {
      const full = questionnaireText('phq9', locale)
      const short = questionnaireText('phq8', locale)
      expect(short?.items).toEqual(full?.items.slice(0, 8))
      expect(short?.lead).toBe(full?.lead)
      expect(short?.title).toBe('PHQ-8')
      expect(short?.source.document).toContain('except the 9th item on self-harm')
    }
  })

  it('shows the mandatory ASRS notice and keeps the official shading', () => {
    for (const locale of ['pt-BR', 'pt-PT', 'en-US'] as const) {
      expect(questionnaireText('asrs6', locale)?.notice).toBe(
        '© New York University and the President and Fellows of Harvard College',
      )
    }
    expect(questionnaireForms.asrs6.shaded?.from).toEqual([2, 2, 2, 3, 3, 3])
  })

  it('keeps the Kessler copyright and its own K6 stem', () => {
    expect(questionnaireText('k10', 'pt-BR')?.notice).toBe(
      'Copyright © Ronald C. Kessler, PhD. All rights reserved.',
    )
    expect(questionnaireText('k10', 'pt-BR')?.standaloneItems).toEqual([8])
    expect(questionnaireText('k6', 'en-US')?.stem).toBe(
      'During the past 30 days, about how often did you feel …',
    )
    expect(questionnaireText('k10', 'en-US')?.options[0]).toEqual({
      label: 'All of the time',
      value: 5,
    })
  })

  it('uses the Brazilian PCL-5 form without Criterion A', () => {
    const text = questionnaireText('pcl5', 'pt-BR')
    expect(text?.stem).toBe('No último mês, quanto você foi incomodado por:')
    expect(text?.source.citation).toContain('doi:10.1590/0101-60830000000107')
  })
})
