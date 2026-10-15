export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '' && !word.endsWith('.'))
  const first = words.at(0) ?? name.trim()
  const last = words.length > 1 ? words.at(-1) : undefined
  return `${first.charAt(0)}${last?.charAt(0) ?? ''}`.toUpperCase()
}
