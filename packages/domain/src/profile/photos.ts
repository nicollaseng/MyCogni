import { uploadProblem, type UploadCandidate, type UploadProblem } from '../files/uploads.ts'

export const avatarBucket = 'avatars'

export const avatarTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export type AvatarType = (typeof avatarTypes)[number]

export const avatarMaxBytes = 5 * 1024 * 1024

export const avatarSourceMaxBytes = 20 * 1024 * 1024

export const avatarRenderSize = 512

const extensions: Readonly<Record<AvatarType, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function isAvatarType(type: string): type is AvatarType {
  return avatarTypes.some((candidate) => candidate === type)
}

export function avatarExtension(type: AvatarType): string {
  return extensions[type]
}

export function avatarProblem(file: UploadCandidate): UploadProblem | null {
  return uploadProblem(file, { accepts: isAvatarType, maxBytes: avatarMaxBytes })
}

export function avatarSourceProblem(file: UploadCandidate): UploadProblem | null {
  return uploadProblem(file, { accepts: isAvatarType, maxBytes: avatarSourceMaxBytes })
}

export function isOwnAvatarPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/[a-z0-9-]{1,64}\\.(jpg|png|webp)$`).test(path)
}

const signatures: readonly { type: AvatarType; bytes: readonly number[]; offset: number }[] = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  { type: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
]

const riff = [0x52, 0x49, 0x46, 0x46]

function startsWith(content: Uint8Array, bytes: readonly number[], offset: number): boolean {
  return bytes.every((value, index) => content[offset + index] === value)
}

export function sniffAvatarType(content: Uint8Array): AvatarType | null {
  const match = signatures.find(
    ({ type, bytes, offset }) =>
      startsWith(content, bytes, offset) && (type !== 'image/webp' || startsWith(content, riff, 0)),
  )
  return match?.type ?? null
}
