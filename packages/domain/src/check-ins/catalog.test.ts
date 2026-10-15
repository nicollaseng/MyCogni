import { describe, expect, it } from '@jest/globals'
import {
  contextGroups,
  contextIds,
  emotionFamilies,
  emotionIds,
  isContextId,
  isEmotionId,
  suggestedContexts,
} from './catalog.ts'

describe('check-in catalog', () => {
  it('names every emotion and context once', () => {
    expect(new Set(emotionIds).size).toBe(emotionIds.length)
    expect(new Set(contextIds).size).toBe(contextIds.length)
    expect(emotionIds).toHaveLength(61)
    expect(contextIds).toHaveLength(28)
  })

  it('orders the emotion families from the hardest to the lightest feelings', () => {
    expect(emotionFamilies.map((family) => family.id)).toEqual([
      'anxiety',
      'sadness',
      'anger',
      'exhaustion',
      'mixed',
      'calm',
      'energy',
      'connection',
      'joy',
    ])
    expect(contextGroups.map((group) => group.id)).toEqual([
      'body',
      'people',
      'routine',
      'world',
      'inner',
    ])
  })

  it('suggests only contexts that exist', () => {
    expect(suggestedContexts.every(isContextId)).toBe(true)
  })

  it('tells catalog entries apart from words the person typed', () => {
    expect(isEmotionId('worry')).toBe(true)
    expect(isEmotionId('preocupação')).toBe(false)
    expect(isContextId('free_time')).toBe(true)
    expect(isContextId('jardinagem')).toBe(false)
  })
})
