import { describe, expect, it } from '@jest/globals'
import { matchingTags } from './search'

const choices = [
  { id: 'anxiety', label: 'ansiedade' },
  { id: 'tiredness', label: 'cansaço' },
  { id: 'work', label: 'trabalho' },
]

describe('matchingTags', () => {
  it('finds catalog tags by their translated name, ignoring accents and case', () => {
    expect(matchingTags('CANSACO', choices)).toEqual(['tiredness'])
    expect(matchingTags('an', choices)).toEqual(['anxiety', 'tiredness'])
    expect(matchingTags('a', choices)).toEqual([])
    expect(matchingTags('praia', choices)).toEqual([])
  })
})
