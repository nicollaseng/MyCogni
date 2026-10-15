export const avatarBucket = 'avatars'

export const avatarMaxBytes = 2 * 1024 * 1024

const extensions: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function avatarExtension(type: string): string | null {
  return extensions[type] ?? null
}
