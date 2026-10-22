import { normalizeText } from '../safety/crisis-detector.ts'

export const dataExportStatuses = ['queued', 'running', 'ready', 'failed', 'expired'] as const

export type DataExportStatus = (typeof dataExportStatuses)[number]

export const dataExportLimits = {
  availableDays: 7,
  requestsPerDay: 3,
  downloadSeconds: 300,
  staleHours: 3,
} as const

export const exportSchemaVersion = 1

const dayInMilliseconds = 24 * 60 * 60 * 1000

export function isActiveExport(status: DataExportStatus): boolean {
  return status === 'queued' || status === 'running'
}

export function exportExpiry(readyAt: Date): Date {
  return new Date(readyAt.getTime() + dataExportLimits.availableDays * dayInMilliseconds)
}

export function isDownloadable(
  { status, expiresAt }: { status: DataExportStatus; expiresAt: Date | null },
  now: Date,
): boolean {
  return status === 'ready' && expiresAt !== null && expiresAt.getTime() > now.getTime()
}

export type CsvValue = string | number | boolean | null

const formulaStart = /^[=+\-@\t\r]/

const byteOrderMark = String.fromCharCode(0xfeff)

export function csvField(value: CsvValue): string {
  if (value === null) {
    return ''
  }
  const text = typeof value === 'string' && formulaStart.test(value) ? `'${value}` : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function csvDocument(
  header: readonly string[],
  rows: readonly (readonly CsvValue[])[],
): string {
  return `${byteOrderMark}${[header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n')}\r\n`
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function fileSlug(text: string | null, fallback: string): string {
  const slug = normalizeText(text ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '')
  return slug === '' ? fallback : slug
}

export function uniqueName(name: string, used: Set<string>): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const extension = dot > 0 ? name.slice(dot) : ''
  let candidate = name
  for (let copy = 2; used.has(candidate); copy += 1) {
    candidate = `${base}-${String(copy)}${extension}`
  }
  used.add(candidate)
  return candidate
}
