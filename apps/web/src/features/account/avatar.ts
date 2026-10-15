export function initialsOf(name: string | null, email: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').trim()
  const words = source.split(/[\s@._-]+/).filter((word) => word.length > 0)
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
