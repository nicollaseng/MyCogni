import { describe, expect, it } from '@jest/globals'
import { emotionFamilies } from './catalog'
import { emotionTabs, familiesByCloseness, suggestEmotions } from './suggestions'

describe('emotion suggestions', () => {
  it('suggests eight different emotions for any mood', () => {
    for (const valence of [0, 0.25, 0.5, 0.75, 1]) {
      const suggestions = suggestEmotions(valence)

      expect(suggestions).toHaveLength(8)
      expect(new Set(suggestions).size).toBe(8)
    }
  })

  it('suggests difficult emotions on a bad day', () => {
    expect(suggestEmotions(1 / 6)).toEqual([
      'ansiedade',
      'preocupação',
      'medo',
      'raiva',
      'irritação',
      'frustração',
      'tristeza',
      'desânimo',
    ])
  })

  it('suggests pleasant emotions on a good day', () => {
    expect(suggestEmotions(1).slice(0, 3)).toEqual(['alegria', 'felicidade', 'entusiasmo'])
  })

  it('orders every family by how close it is to the mood', () => {
    const titles = familiesByCloseness(0.8).map((family) => family.title)

    expect(titles[0]).toBe('energia')
    expect(titles.at(-1)).toBe('tristeza')
    expect(titles).toHaveLength(emotionFamilies.length)
  })

  it('starts the tabs with the suggestions', () => {
    const tabs = emotionTabs(0.5)

    expect(tabs[0]?.title).toBe('sugestões')
    expect(tabs).toHaveLength(emotionFamilies.length + 1)
  })
})
