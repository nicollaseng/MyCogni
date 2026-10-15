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

export function initialsOf(name: string | null, email: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').trim()
  const words = source.split(/[\s@._-]+/).filter((word) => word.length > 0)
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
