import { describe, expect, it } from '@jest/globals'
import {
  avatarExtension,
  avatarMaxBytes,
  avatarProblem,
  avatarSourceMaxBytes,
  avatarSourceProblem,
  isAvatarType,
  isOwnAvatarPath,
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
})
