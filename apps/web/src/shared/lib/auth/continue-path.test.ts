import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import type * as ContinuePaths from './continue-path'

interface StoredCookie {
  value: string
  maxAge?: number
}

const jar = new Map<string, StoredCookie>()

jest.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const cookie = jar.get(name)
        return cookie === undefined ? undefined : { name, value: cookie.value }
      },
      has: (name: string) => jar.has(name),
      set: (name: string, value: string, options: { maxAge?: number }) => {
        jar.set(name, { value, maxAge: options.maxAge })
      },
      delete: (name: string) => {
        jar.delete(name)
      },
    }),
}))

let paths: typeof ContinuePaths

beforeAll(async () => {
  paths = await import('./continue-path')
})

describe('continueTargetOf', () => {
  it('continues to an invitation or to the professional sign up', () => {
    expect(paths.continueTargetOf('/invite/K7M2X9QA')).toBe('/invite/K7M2X9QA')
    expect(paths.continueTargetOf('/pro/join')).toBe('/pro/join')
  })

  it('refuses any other destination, so the link cannot send people elsewhere', () => {
    expect(paths.continueTargetOf('https://evil.example/invite/K7M2X9QA')).toBeNull()
    expect(paths.continueTargetOf('//evil.example')).toBeNull()
    expect(paths.continueTargetOf('/invite/K7M2X9QA/../../me')).toBeNull()
    expect(paths.continueTargetOf('/invite/k7m2x9qa')).toBeNull()
    expect(paths.continueTargetOf('/me')).toBeNull()
    expect(paths.continueTargetOf('')).toBeNull()
  })
})

describe('the continue cookie', () => {
  beforeEach(() => {
    jar.clear()
  })

  it('remembers where to continue for thirty minutes only', async () => {
    await paths.rememberContinuePath('/pro/join')

    expect(jar.get('MYCOGNI_CONTINUE')).toEqual({ value: '/pro/join', maxAge: 30 * 60 })
  })

  it('ignores destinations outside the allowed ones', async () => {
    await paths.rememberContinuePath('/me')

    expect(jar.size).toBe(0)
  })

  it('is consumed by the first sign in that reads it', async () => {
    await paths.rememberContinuePath('/invite/K7M2X9QA')

    expect(await paths.takeContinuePath()).toBe('/invite/K7M2X9QA')
    expect(await paths.takeContinuePath()).toBeNull()
    expect(await paths.continuePath()).toBeNull()
  })

  it('keeps a professional intent only while the person signs up as a professional', async () => {
    await paths.rememberAccountIntent('professional')
    expect(await paths.continuePath()).toBe('/pro/join')

    await paths.rememberAccountIntent('patient')
    expect(await paths.continuePath()).toBeNull()
  })

  it('keeps an invitation when the person signs up as a patient', async () => {
    await paths.rememberContinuePath('/invite/K7M2X9QA')

    await paths.rememberAccountIntent('patient')

    expect(await paths.continuePath()).toBe('/invite/K7M2X9QA')
  })
})
