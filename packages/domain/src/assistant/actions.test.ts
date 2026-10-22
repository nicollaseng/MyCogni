import { describe, expect, it } from '@jest/globals'
import { validActions } from './actions.ts'

describe('validActions', () => {
  it('keeps catalog actions in order, at most two', () => {
    expect(
      validActions(
        [
          { type: 'breathe', id: null },
          { type: 'article', id: 'worry-time' },
          { type: 'track', id: 'low-mood' },
        ],
        'personal',
      ),
    ).toEqual([{ type: 'breathe' }, { type: 'article', id: 'worry-time' }])
  })

  it('accepts every action kind', () => {
    expect(
      validActions([{ type: 'track', id: 'sleep-and-rest' }, { type: 'check_in' }], 'personal'),
    ).toEqual([{ type: 'track', id: 'sleep-and-rest' }, { type: 'check_in' }])
    expect(validActions([{ type: 'mybook', id: 'ignored' }], 'personal')).toEqual([
      { type: 'mybook' },
    ])
  })

  it('drops unknown kinds, unknown ids, links and repeats', () => {
    expect(
      validActions(
        [
          { type: 'link', id: 'https://example.com' },
          { type: 'article', id: 'https://example.com' },
          { type: 'track', id: null },
          { type: 'article' },
          { type: 'breathe' },
          { type: 'breathe', id: 'again' },
          { type: 'article', id: 'sleep-and-mood' },
        ],
        'personal',
      ),
    ).toEqual([{ type: 'breathe' }, { type: 'article', id: 'sleep-and-mood' }])
  })

  it('never gives actions to professionals', () => {
    expect(validActions([{ type: 'breathe' }], 'professional')).toEqual([])
  })
})
