import { describe, expect, it } from '@jest/globals'
import { isAvatarType } from '../profile/photos.ts'
import { sniffFileType, sniffOneOf } from './signatures.ts'

function ascii(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0))
}

const pdf = ascii('%PDF-1.4\n%')
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
const webp = ascii('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ')
const unwrappedWebp = ascii('JUNK\u0000\u0000\u0000\u0000WEBPVP8 ')
const html = ascii('<!doctype html>')

describe('file signatures', () => {
  it('recognises PDF, JPEG, PNG and WebP from their first bytes', () => {
    expect(sniffFileType(pdf)).toBe('application/pdf')
    expect(sniffFileType(jpeg)).toBe('image/jpeg')
    expect(sniffFileType(png)).toBe('image/png')
    expect(sniffFileType(webp)).toBe('image/webp')
  })

  it('refuses anything else, whatever its name says', () => {
    expect(sniffFileType(html)).toBeNull()
    expect(sniffFileType(unwrappedWebp)).toBeNull()
    expect(sniffFileType(new Uint8Array())).toBeNull()
  })

  it('keeps a recognised type only when the caller accepts it', () => {
    expect(sniffOneOf(png, isAvatarType)).toBe('image/png')
    expect(sniffOneOf(pdf, isAvatarType)).toBeNull()
    expect(sniffOneOf(html, isAvatarType)).toBeNull()
  })
})
