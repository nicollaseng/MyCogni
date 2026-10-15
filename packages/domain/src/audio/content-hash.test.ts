import { describe, expect, it } from '@jest/globals'
import { contentHash } from './content-hash.ts'

describe('contentHash', () => {
  it('follows FNV-1a 64 and always gives 16 hex characters', () => {
    expect(contentHash('')).toBe('cbf29ce484222325')
    expect(contentHash('a')).toBe('af63dc4c8601ec8c')
    expect(contentHash('foobar')).toBe('85944171f73967e8')
  })

  it('changes with any change in the text', () => {
    expect(contentHash('Sono e humor.')).not.toBe(contentHash('Sono e humor'))
    expect(contentHash('ação')).toMatch(/^[0-9a-f]{16}$/)
  })
})
