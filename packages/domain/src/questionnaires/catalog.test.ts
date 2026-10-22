import { describe, expect, it } from '@jest/globals'
import {
  catalogEntryOf,
  catalogOfArea,
  isQuestionnaireVariant,
  questionnaireCatalog,
  questionnaireVariants,
  satepsiCheckedOn,
} from './catalog.ts'

describe('questionnaire catalog', () => {
  it('lists only the instruments released now, in picker order', () => {
    expect(questionnaireCatalog.map((entry) => entry.name)).toEqual([
      'PHQ-9',
      'PHQ-8',
      'GAD-7',
      'PCL-5',
      'ASRS v1.1',
      'K10',
      'K6',
    ])
  })

  it('groups variants under their condition', () => {
    expect(catalogOfArea('depression').map((entry) => entry.variant)).toEqual(['phq9', 'phq8'])
    expect(catalogOfArea('distress').map((entry) => entry.variant)).toEqual(['k10', 'k6'])
    expect(catalogOfArea('trauma').map((entry) => entry.variant)).toEqual(['pcl5'])
  })

  it('keeps the SATEPSI status of each instrument with the date it was checked', () => {
    expect(satepsiCheckedOn).toBe('2026-10-22')
    expect(catalogEntryOf('phq9').satepsi).toBe('nao_privativo')
    expect(catalogEntryOf('gad7').satepsi).toBe('nao_avaliado')
    for (const variant of ['phq8', 'pcl5', 'asrs6', 'k10', 'k6'] as const) {
      expect(catalogEntryOf(variant)).toEqual(
        expect.objectContaining({ satepsi: 'nao_consta', satepsiCheckedOn: '2026-10-22' }),
      )
    }
  })

  it('prefers the PHQ-9 and the K10 over their shorter variants', () => {
    expect(catalogEntryOf('phq9').primary).toBe(true)
    expect(catalogEntryOf('phq8').primary).toBe(false)
    expect(catalogEntryOf('k6').primary).toBe(false)
  })

  it('recognizes only known variants', () => {
    expect(questionnaireVariants.every(isQuestionnaireVariant)).toBe(true)
    expect(isQuestionnaireVariant('pcl5_8')).toBe(false)
    expect(isQuestionnaireVariant('who5')).toBe(false)
    expect(isQuestionnaireVariant(9)).toBe(false)
  })
})
