import { describe, expect, it } from '@jest/globals'
import {
  avatarExtension,
  avatarMaxBytes,
  avatarProblem,
  avatarSourceMaxBytes,
  avatarSourceProblem,
  isAvatarType,
  isOwnAvatarPath,
  sniffAvatarType,
} from './photos.ts'

const user = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'
const other = '0b8f7d2e-4c1a-4e7b-9a55-3c2d1e0f9a88'

describe('profile photos', () => {
  it('accepts JPG, PNG and WebP photos up to 5 MB', () => {
    expect(isAvatarType('image/webp')).toBe(true)
    expect(isAvatarType('image/gif')).toBe(false)
    expect(avatarExtension('image/jpeg')).toBe('jpg')
    expect(avatarProblem({ type: 'image/png', size: avatarMaxBytes })).toBeNull()
    expect(avatarProblem({ type: 'image/png', size: avatarMaxBytes + 1 })).toBe('size')
    expect(avatarProblem({ type: 'application/pdf', size: 10 })).toBe('type')
  })

  it('takes larger originals, since the photo is cropped and resized before it is sent', () => {
    expect(avatarSourceProblem({ type: 'image/jpeg', size: avatarSourceMaxBytes })).toBeNull()
    expect(avatarSourceProblem({ type: 'image/jpeg', size: avatarSourceMaxBytes + 1 })).toBe('size')
    expect(avatarSourceProblem({ type: 'image/heic', size: 10 })).toBe('type')
  })

  it('keeps every photo in the folder of its owner', () => {
    expect(isOwnAvatarPath(`${user}/avatar-1760000000000.jpg`, user)).toBe(true)
    expect(isOwnAvatarPath(`${user}/${other}.webp`, user)).toBe(true)
    expect(isOwnAvatarPath(`${other}/avatar-1.jpg`, user)).toBe(false)
    expect(isOwnAvatarPath(`${user}/../${other}/avatar-1.jpg`, user)).toBe(false)
    expect(isOwnAvatarPath(`${user}/avatar-1.pdf`, user)).toBe(false)
  })

  it('recognises JPG, PNG and WebP files by their first bytes', () => {
    const riff = [0x52, 0x49, 0x46, 0x46]
    const size = [1, 2, 3, 4]
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00])
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    const webp = Uint8Array.from([...riff, ...size, 0x57, 0x45, 0x42, 0x50])
    const wave = Uint8Array.from([...riff, ...size, 0x57, 0x41, 0x56, 0x45])
    const unwrappedWebp = Uint8Array.from([0, 0, 0, 0, ...size, 0x57, 0x45, 0x42, 0x50])
    const html = Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e])

    expect(sniffAvatarType(jpeg)).toBe('image/jpeg')
    expect(sniffAvatarType(png)).toBe('image/png')
    expect(sniffAvatarType(webp)).toBe('image/webp')
    expect(sniffAvatarType(wave)).toBeNull()
    expect(sniffAvatarType(unwrappedWebp)).toBeNull()
    expect(sniffAvatarType(html)).toBeNull()
    expect(sniffAvatarType(new Uint8Array())).toBeNull()
  })
})
