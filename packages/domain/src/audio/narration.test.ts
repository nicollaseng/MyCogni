import { describe, expect, it } from '@jest/globals'
import {
  emptyNarrationManifest,
  findNarration,
  narrationFingerprint,
  narrationPath,
  type NarrationManifest,
} from './narration.ts'

const request = { language: 'pt-BR', voice: 'jessica', text: 'Sono e humor.' } as const

describe('narrationFingerprint', () => {
  it('is stable for the same text, voice and language', () => {
    expect(narrationFingerprint(request)).toBe(narrationFingerprint({ ...request }))
    expect(narrationFingerprint(request)).toMatch(/^[0-9a-f]{16}$/)
  })

  it('changes when the text, the voice or the language changes', () => {
    const base = narrationFingerprint(request)
    expect(narrationFingerprint({ ...request, text: 'Sono e humor!' })).not.toBe(base)
    expect(narrationFingerprint({ ...request, voice: 'mark' })).not.toBe(base)
    expect(narrationFingerprint({ ...request, language: 'pt-PT' })).not.toBe(base)
  })
})

describe('narrationPath', () => {
  it('files each rendering under its language and voice, named by key and fingerprint', () => {
    expect(
      narrationPath({ language: 'en', voice: 'hope' }, 'step/low-mood/reflect', 'abc123'),
    ).toBe('en/hope/step--low-mood--reflect-abc123.mp3')
  })
})

describe('findNarration', () => {
  it('finds the audio rendered from the current text only', () => {
    const fingerprint = narrationFingerprint(request)
    const manifest: NarrationManifest = {
      version: 1,
      files: { [fingerprint]: { path: 'pt-BR/jessica/a.mp3', bytes: 1200 } },
    }
    expect(findNarration(manifest, request)).toEqual({ path: 'pt-BR/jessica/a.mp3', bytes: 1200 })
    expect(findNarration(manifest, { ...request, text: 'Texto novo.' })).toBeNull()
    expect(findNarration(emptyNarrationManifest, request)).toBeNull()
  })
})
