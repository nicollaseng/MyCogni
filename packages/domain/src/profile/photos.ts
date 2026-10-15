import { uploadProblem, type UploadCandidate, type UploadProblem } from '../files/uploads.ts'

export const avatarBucket = 'avatars'

export const avatarTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export type AvatarType = (typeof avatarTypes)[number]

export const avatarMaxBytes = 5 * 1024 * 1024

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

export function isOwnAvatarPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/[a-z0-9-]{1,64}\\.(jpg|png|webp)$`).test(path)
}
