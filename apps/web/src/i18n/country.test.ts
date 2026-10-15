import { describe, expect, it } from '@jest/globals'
import { clientIp, countryOfIp } from './country'

describe('countryOfIp', () => {
  it.each([
    ['200.147.67.142', 'BR'],
    ['193.136.66.1', 'PT'],
    ['81.2.69.142', 'GB'],
    ['8.8.8.8', 'US'],
    ['2804:14c::1', 'BR'],
  ])('finds the country of %s', (ip, country) => {
    expect(countryOfIp(ip)).toBe(country)
  })

  it('has no country for private or invalid addresses', () => {
    expect(countryOfIp('127.0.0.1')).toBeNull()
    expect(countryOfIp('::1')).toBeNull()
    expect(countryOfIp('not-an-ip')).toBeNull()
  })
})

describe('clientIp', () => {
  it('takes the first address the proxy forwarded', () => {
    expect(clientIp('200.147.67.142, 10.0.0.1', null)).toBe('200.147.67.142')
  })

  it('falls back to the real ip header', () => {
    expect(clientIp(null, '193.136.66.1')).toBe('193.136.66.1')
    expect(clientIp('', '193.136.66.1')).toBe('193.136.66.1')
    expect(clientIp(null, null)).toBeNull()
  })
})
