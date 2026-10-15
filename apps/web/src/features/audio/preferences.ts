import {
  ambientVolumeOf,
  defaultAmbientScope,
  defaultAmbientSound,
  defaultAmbientVolume,
  defaultNarrationSpeed,
  isAmbientScope,
  isAmbientSoundId,
  isNarrationSpeed,
  isNarrationVoiceId,
  type AmbientScope,
  type AmbientSoundId,
  type NarrationSpeed,
  type NarrationVoiceId,
} from '@mycogni/domain'
import { useSyncExternalStore } from 'react'

export interface AudioPreferences {
  voice: NarrationVoiceId | null
  speed: NarrationSpeed
  sound: AmbientSoundId
  volume: number
  scope: AmbientScope
}

export const defaultAudioPreferences: AudioPreferences = {
  voice: null,
  speed: defaultNarrationSpeed,
  sound: defaultAmbientSound,
  volume: defaultAmbientVolume,
  scope: defaultAmbientScope,
}

export const audioPreferencesKey = 'mycogni.audio'

function fieldsOf(raw: string | null): Record<string, unknown> {
  if (raw === null) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? { ...parsed } : {}
  } catch {
    return {}
  }
}

export function parseAudioPreferences(raw: string | null): AudioPreferences {
  const { voice, speed, sound, volume, scope } = fieldsOf(raw)
  return {
    voice: isNarrationVoiceId(voice) ? voice : null,
    speed: isNarrationSpeed(speed) ? speed : defaultNarrationSpeed,
    sound: isAmbientSoundId(sound) ? sound : defaultAmbientSound,
    volume: volume === undefined ? defaultAmbientVolume : ambientVolumeOf(volume),
    scope: isAmbientScope(scope) ? scope : defaultAmbientScope,
  }
}

function storedText(): string | null {
  try {
    return window.localStorage.getItem(audioPreferencesKey)
  } catch {
    return null
  }
}

const listeners = new Set<() => void>()

let cached: { raw: string | null; value: AudioPreferences } | null = null

let unsaved: string | null = null

function currentText(): string | null {
  return unsaved ?? storedText()
}

export function readAudioPreferences(): AudioPreferences {
  const raw = currentText()
  if (cached?.raw !== raw) {
    cached = { raw, value: parseAudioPreferences(raw) }
  }
  return cached.value
}

export function saveAudioPreferences(change: Partial<AudioPreferences>): void {
  const raw = JSON.stringify({ ...readAudioPreferences(), ...change })
  try {
    window.localStorage.setItem(audioPreferencesKey, raw)
    unsaved = null
  } catch {
    unsaved = raw
  }
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export function useAudioPreferences(): AudioPreferences {
  return useSyncExternalStore(subscribe, readAudioPreferences, () => defaultAudioPreferences)
}
