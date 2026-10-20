import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import {
  audioPreferencesKey,
  defaultAudioPreferences,
  parseAudioPreferences,
  saveAudioPreferences,
  useAudioPreferences,
} from './preferences'

describe('parseAudioPreferences', () => {
  it('starts with the sea, only in Zen, very low, normal speed and the default voice', () => {
    expect(parseAudioPreferences(null)).toEqual(defaultAudioPreferences)
    expect(defaultAudioPreferences).toEqual({
      voice: null,
      speed: 1,
      sound: 'sea',
      volume: 0.12,
      scope: 'zen',
      paused: false,
    })
  })

  it('keeps valid choices and replaces anything else with the default', () => {
    expect(
      parseAudioPreferences(
        JSON.stringify({
          voice: 'mark',
          speed: 1.1,
          sound: 'rain',
          volume: 0.4,
          scope: 'app',
          paused: true,
        }),
      ),
    ).toEqual({ voice: 'mark', speed: 1.1, sound: 'rain', volume: 0.4, scope: 'app', paused: true })
    expect(
      parseAudioPreferences(
        JSON.stringify({
          voice: 'rachel',
          speed: 3,
          sound: 'jazz',
          volume: 'alto',
          scope: 'x',
          paused: 'yes',
        }),
      ),
    ).toEqual({ ...defaultAudioPreferences, volume: 0.12 })
    expect(parseAudioPreferences('{not json')).toEqual(defaultAudioPreferences)
    expect(parseAudioPreferences('7')).toEqual(defaultAudioPreferences)
  })
})

describe('useAudioPreferences', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
  })

  it('saves choices on this device and updates every reader', () => {
    const { result } = renderHook(() => useAudioPreferences())

    act(() => {
      saveAudioPreferences({ sound: 'forest', scope: 'app' })
    })

    expect(result.current.sound).toBe('forest')
    expect(result.current.scope).toBe('app')
    expect(JSON.parse(window.localStorage.getItem(audioPreferencesKey) ?? '{}')).toMatchObject({
      sound: 'forest',
      scope: 'app',
    })
  })

  it('keeps working for the session when the browser blocks storage', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useAudioPreferences())
    expect(result.current.sound).toBe('sea')

    act(() => {
      saveAudioPreferences({ sound: 'brown-noise' })
    })

    expect(result.current.sound).toBe('brown-noise')
  })
})
