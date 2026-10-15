function wordsOf(text: string, separator: RegExp): string[] {
  return text
    .trim()
    .split(separator)
    .filter((word) => word !== '' && !word.endsWith('.'))
}

export function initialsOf(name: string | null, email: string | null = null): string {
  const named = wordsOf(name ?? '', /\s+/)
  const words = named.length > 0 ? named : wordsOf(email?.split('@')[0] ?? '', /[._-]+/)
  const first = words.at(0) ?? (name ?? '').trim()
  const last = words.length > 1 ? words.at(-1) : undefined
  return `${first.charAt(0)}${last?.charAt(0) ?? ''}`.toUpperCase()
}
