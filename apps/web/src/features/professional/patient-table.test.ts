import { describe, expect, it } from '@jest/globals'
import {
  defaultSort,
  filterCounts,
  matchesSearch,
  nextSort,
  normalizeText,
  patientFilterOf,
  visiblePatients,
} from './patient-table'
import { patient, screening } from './test-data'

const joao = patient({ name: 'João Araújo', moodAverage: 2.1, checkInsLastWeek: 1 })
const ana = patient({
  name: 'Ana Lima',
  attention: ['inactive'],
  lastCheckIn: null,
  checkInsLastWeek: 0,
  moodAverage: null,
  screenings: [screening({ instrument: 'gad7', totalScore: 11, severity: 'moderate' })],
})
const bruno = patient({
  name: 'Bruno Reis',
  attention: ['risk_item', 'severe_screening'],
  moodAverage: 1.5,
  screenings: [
    screening({ totalScore: 21, severity: 'severe', hasRiskFlag: true }),
    screening({ totalScore: 6, severity: 'mild', completedAt: '2026-09-01T12:00:00Z' }),
  ],
})
const carla = patient({
  name: 'Carla Dias',
  attention: ['low_mood'],
  moodAverage: 1.8,
  lastCheckIn: { moodLevel: 2, recordedAt: '2026-10-15T09:00:00Z' },
})
const unnamed = patient({ name: null, checkInsLastWeek: 6, moodAverage: 5 })

const everyone = [joao, ana, bruno, carla, unnamed]

function names(view: Parameters<typeof visiblePatients>[1]) {
  return visiblePatients(everyone, view).map((summary) => summary.name)
}

describe('normalizeText', () => {
  it('ignores accents, case and surrounding spaces', () => {
    expect(normalizeText('  João ARAÚJO ')).toBe('joao araujo')
  })
})

describe('matchesSearch', () => {
  it('finds a name typed without accents', () => {
    expect(matchesSearch(joao, 'joao arau')).toBe(true)
    expect(matchesSearch(joao, 'lima')).toBe(false)
    expect(matchesSearch(unnamed, '')).toBe(true)
  })
})

describe('visiblePatients', () => {
  it('puts the most urgent attention first, then everybody else by name', () => {
    expect(names({ query: '', filter: 'all', sort: defaultSort })).toEqual([
      'Bruno Reis',
      'Carla Dias',
      'Ana Lima',
      'João Araújo',
      null,
    ])
  })

  it('filters by attention, inactivity and questionnaire severity', () => {
    expect(names({ query: '', filter: 'attention', sort: defaultSort })).toEqual([
      'Bruno Reis',
      'Carla Dias',
      'Ana Lima',
    ])
    expect(names({ query: '', filter: 'inactive', sort: defaultSort })).toEqual(['Ana Lima'])
    expect(names({ query: '', filter: 'phq9', sort: defaultSort })).toEqual(['Bruno Reis'])
    expect(names({ query: '', filter: 'gad7', sort: defaultSort })).toEqual(['Ana Lima'])
  })

  it('combines the search with the filter', () => {
    expect(names({ query: 'carla', filter: 'attention', sort: defaultSort })).toEqual([
      'Carla Dias',
    ])
    expect(names({ query: 'carla', filter: 'inactive', sort: defaultSort })).toEqual([])
  })

  it('sorts by mood with the lowest first and patients without entries last', () => {
    expect(names({ query: '', filter: 'all', sort: { key: 'mood', direction: 'asc' } })).toEqual([
      'Bruno Reis',
      'Carla Dias',
      'João Araújo',
      null,
      'Ana Lima',
    ])
    expect(names({ query: '', filter: 'all', sort: { key: 'mood', direction: 'desc' } })).toEqual([
      null,
      'João Araújo',
      'Carla Dias',
      'Bruno Reis',
      'Ana Lima',
    ])
  })

  it('sorts by the latest questionnaire score, by the last entry and by name', () => {
    expect(names({ query: '', filter: 'all', sort: { key: 'phq9', direction: 'desc' } })).toEqual([
      'Bruno Reis',
      'Ana Lima',
      'Carla Dias',
      'João Araújo',
      null,
    ])
    expect(
      names({ query: '', filter: 'all', sort: { key: 'lastCheckIn', direction: 'desc' } }),
    ).toEqual(['Carla Dias', 'Bruno Reis', 'João Araújo', null, 'Ana Lima'])
    expect(names({ query: '', filter: 'all', sort: { key: 'name', direction: 'desc' } })).toEqual([
      'João Araújo',
      'Carla Dias',
      'Bruno Reis',
      'Ana Lima',
      null,
    ])
  })
})

describe('nextSort', () => {
  it('starts each column in its most useful direction and flips on the second click', () => {
    expect(nextSort(defaultSort, 'name')).toEqual({ key: 'name', direction: 'asc' })
    expect(nextSort(defaultSort, 'mood')).toEqual({ key: 'mood', direction: 'asc' })
    expect(nextSort(defaultSort, 'week')).toEqual({ key: 'week', direction: 'desc' })
    expect(nextSort({ key: 'week', direction: 'desc' }, 'week')).toEqual({
      key: 'week',
      direction: 'asc',
    })
  })
})

describe('filterCounts', () => {
  it('counts how many patients each filter would show', () => {
    expect(filterCounts(everyone)).toEqual({ all: 5, attention: 3, inactive: 1, phq9: 1, gad7: 1 })
  })
})

describe('patientFilterOf', () => {
  it('reads a known filter from the address and falls back to everybody', () => {
    expect(patientFilterOf('attention')).toBe('attention')
    expect(patientFilterOf('unknown')).toBe('all')
    expect(patientFilterOf(undefined)).toBe('all')
  })
})
