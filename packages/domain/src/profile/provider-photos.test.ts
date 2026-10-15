import { describe, expect, it } from '@jest/globals'
import { googlePhotoUrl, isGooglePhotoHost } from './provider-photos.ts'

describe('provider photos', () => {
  it('accepts only Google image hosts', () => {
    expect(isGooglePhotoHost('lh3.googleusercontent.com')).toBe(true)
    expect(isGooglePhotoHost('googleusercontent.com')).toBe(true)
    expect(isGooglePhotoHost('evilgoogleusercontent.com')).toBe(false)
    expect(isGooglePhotoHost('lh3.googleusercontent.com.example.org')).toBe(false)
    expect(isGooglePhotoHost('example.org')).toBe(false)
  })

  it('asks Google for a square photo of the size the app stores', () => {
    expect(googlePhotoUrl('https://lh3.googleusercontent.com/a/ACg8ocK123=s96-c')).toBe(
      'https://lh3.googleusercontent.com/a/ACg8ocK123=s512-c',
    )
    expect(googlePhotoUrl('https://lh3.googleusercontent.com/a/ACg8ocK123', 256)).toBe(
      'https://lh3.googleusercontent.com/a/ACg8ocK123=s256-c',
    )
    expect(googlePhotoUrl('https://lh5.googleusercontent.com/a-/AOh14Gi=s96-c-k-no#top')).toBe(
      'https://lh5.googleusercontent.com/a-/AOh14Gi=s512-c',
    )
  })

  it('keeps the query and asks for a size even when the address has no path', () => {
    expect(googlePhotoUrl(' https://LH3.googleusercontent.com/a/X?authuser=0 ')).toBe(
      'https://lh3.googleusercontent.com/a/X=s512-c?authuser=0',
    )
    expect(googlePhotoUrl('https://lh3.googleusercontent.com')).toBe(
      'https://lh3.googleusercontent.com/=s512-c',
    )
  })

  it('leaves older file-style photo addresses as they are', () => {
    const legacy = 'https://lh3.googleusercontent.com/-Xd/AAAAAAAAAAI/AAAA/4252/s96-c/photo.jpg'

    expect(googlePhotoUrl(legacy)).toBe(legacy)
  })

  it('refuses anything that is not plain https on a Google image host', () => {
    expect(googlePhotoUrl('http://lh3.googleusercontent.com/a/ACg8')).toBeNull()
    expect(googlePhotoUrl('https://example.org/a/ACg8=s96-c')).toBeNull()
    expect(googlePhotoUrl('https://user:secret@lh3.googleusercontent.com/a/ACg8')).toBeNull()
    expect(googlePhotoUrl('https://lh3.googleusercontent.com:8443/a/ACg8')).toBeNull()
    expect(googlePhotoUrl('https://lh3.googleusercontent.com\\@example.org/a')).toBeNull()
    expect(googlePhotoUrl('https://lh3.googleusercontent.com.example.org/a')).toBeNull()
    expect(googlePhotoUrl('not a url')).toBeNull()
    expect(googlePhotoUrl('')).toBeNull()
  })
})
