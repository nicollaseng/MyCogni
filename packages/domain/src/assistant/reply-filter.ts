import { normalizeText } from '../safety/crisis-detector.ts'

export interface ReplyFilterOptions {
  ownEmail: string | null
  hiddenTerms: readonly string[]
  maxLength: number
}

const secretPatterns: readonly RegExp[] = [
  /\beyJ[\w-]{6,}\.[\w-]{6,}\.[\w-]{6,}/g,
  /\bBearer\s+[\w.~+/-]+=*/gi,
  /\b(?:sk|pk|rk)[-_](?:[a-z]+[-_])?[A-Za-z0-9_-]{16,}/g,
  /\b(?:ghp|gho|ghs|github_pat|xox[abpr]|AKIA|AIza)[A-Za-z0-9_-]{12,}/g,
  /\b[A-Z][A-Z0-9_]*_(?:KEY|SECRET|TOKEN|PASSWORD|URL|DSN)\b/g,
  /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/g,
]

const uuidPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

const emailPattern = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g

const urlPattern = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>()"']*[^\s<>()"'.,;:!?]/gi

const hostPattern =
  /(?<![\w.-])(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/[^\s<>()"']*[^\s<>()"'.,;:!?])?/gi

const pathPattern = /(?<![\w/:.])(?:~|\.{1,2})?\/(?:[\w.-]+\/)+[\w.-]*/g

const windowsPathPattern = /\b[A-Za-z]:\\[^\s]*[^\s.,;:!?]/g

const projectPathPattern =
  /\b(?:src|apps|packages|node_modules|etc|var|usr|home|tmp|private|supabase|drizzle)\/[\w./-]+/g

const filePathPattern = /\b[\w-]+(?:\/[\w-]+)+\.(?:ts|tsx|js|mjs|json|sql|env|ya?ml|toml|sh|py)\b/g

const passageWords = 8

function escapeForPattern(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function withoutTerms(text: string, terms: readonly string[]): string {
  return terms.reduce(
    (current, term) =>
      term === '' ? current : current.replace(new RegExp(escapeForPattern(term), 'gi'), ''),
    text,
  )
}

function tidy(text: string): string {
  return text
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([.,;:!?])/g, '$1')
    .replace(/([,;:])(?:\s*[,;:])+/g, '$1')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function capped(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  const cut = text.slice(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

const internalPatterns: readonly RegExp[] = [
  emailPattern,
  ...secretPatterns,
  uuidPattern,
  urlPattern,
  hostPattern,
  windowsPathPattern,
  pathPattern,
  projectPathPattern,
  filePathPattern,
]

function withoutInternals(text: string, hiddenTerms: readonly string[]): string {
  return withoutTerms(
    internalPatterns.reduce((current, pattern) => current.replace(pattern, ''), text),
    hiddenTerms,
  )
}

export function filterReply(
  text: string,
  { ownEmail, hiddenTerms, maxLength }: ReplyFilterOptions,
): string {
  const parts =
    ownEmail === null ? [text] : text.split(new RegExp(`(${escapeForPattern(ownEmail)})`, 'i'))
  const cleaned = parts
    .map((part, index) => (index % 2 === 1 ? part : withoutInternals(part, hiddenTerms)))
    .join('')
  return capped(tidy(cleaned), maxLength)
}

function wordsOf(text: string): string[] {
  return normalizeText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== '')
}

function passagesOf(words: readonly string[]): string[] {
  return words
    .slice(0, Math.max(words.length - passageWords + 1, 0))
    .map((_, index) => words.slice(index, index + passageWords).join(' '))
}

export function repeatsPassage(text: string, source: string): boolean {
  const known = new Set(passagesOf(wordsOf(source)))
  return passagesOf(wordsOf(text)).some((passage) => known.has(passage))
}
