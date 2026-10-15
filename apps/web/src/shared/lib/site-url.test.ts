import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { sitePath, siteUrlOf } from './site-url'

describe('siteUrlOf', () => {
  const original = { site: process.env.SITE_URL, api: process.env.API_URL }

  beforeEach(() => {
    process.env.SITE_URL = 'https://app.example.com/'
    process.env.API_URL = 'https://api.example.com'
  })

  afterEach(() => {
    process.env.SITE_URL = original.site
    process.env.API_URL = original.api
  })

  it('points to the public site, never to the address the server listens on', () => {
    expect(siteUrlOf('/new-password').href).toBe('https://app.example.com/new-password')
  })

  it('keeps the query string of internal paths', () => {
    expect(siteUrlOf('/sign-in?error=link').href).toBe('https://app.example.com/sign-in?error=link')
  })

  it('never leaves the site', () => {
    expect(sitePath('//evil.example.com/x')).toBe('/')
    expect(sitePath('https://evil.example.com')).toBe('/')
    expect(sitePath('today')).toBe('/')
    expect(siteUrlOf('//evil.example.com').href).toBe('https://app.example.com/')
  })
})
