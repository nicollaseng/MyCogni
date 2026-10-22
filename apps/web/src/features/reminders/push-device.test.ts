import { describe, expect, it } from '@jest/globals'
import { applicationServerKey, isAppleMobile, pushSupportOf } from './push-device'

const desktop = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0',
  maxTouchPoints: 0,
  standalone: false,
  hasServiceWorker: true,
  hasPushManager: true,
  permission: 'default' as NotificationPermission,
}

const iphone = {
  ...desktop,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1',
  maxTouchPoints: 5,
  hasPushManager: false,
  permission: null,
}

describe('pushSupportOf', () => {
  it('is ready on a browser that can receive push', () => {
    expect(pushSupportOf(desktop)).toBe('ready')
  })

  it('asks iPhone and iPad people to add the app to the Home Screen first', () => {
    expect(pushSupportOf(iphone)).toBe('install')
    const ipad = {
      ...iphone,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1',
    }
    expect(isAppleMobile(ipad)).toBe(true)
    expect(pushSupportOf(ipad)).toBe('install')
    expect(isAppleMobile({ ...ipad, maxTouchPoints: 0 })).toBe(false)
  })

  it('works on iPhone once the app runs from the Home Screen', () => {
    expect(
      pushSupportOf({ ...iphone, standalone: true, hasPushManager: true, permission: 'default' }),
    ).toBe('ready')
  })

  it('says when push is blocked or missing', () => {
    expect(pushSupportOf({ ...desktop, permission: 'denied' })).toBe('blocked')
    expect(pushSupportOf({ ...desktop, hasServiceWorker: false })).toBe('unsupported')
    expect(pushSupportOf({ ...desktop, permission: null })).toBe('unsupported')
  })
})

describe('applicationServerKey', () => {
  it('decodes a URL-safe base64 key without padding', () => {
    expect([...applicationServerKey('AQID_-8')]).toEqual([1, 2, 3, 255, 239])
  })
})
