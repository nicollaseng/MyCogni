import type { MoodReportPeriod } from '@mycogni/contracts'

export interface ReportOptions {
  days: MoodReportPeriod
  notes: boolean
  reading: boolean
}

export type DownloadReport = (href: string, options: ReportOptions) => Promise<boolean>

const fileNamePattern = /filename="([^"]+)"/

export function reportQuery({ days, notes, reading }: ReportOptions): string {
  return new URLSearchParams({
    days: String(days),
    notes: String(notes),
    reading: String(reading),
  }).toString()
}

export function fileNameOf(disposition: string | null): string {
  return fileNamePattern.exec(disposition ?? '')?.[1] ?? 'mycogni.pdf'
}

export async function downloadReport(href: string, options: ReportOptions): Promise<boolean> {
  const response = await fetch(`${href}?${reportQuery(options)}`, { cache: 'no-store' })
  if (!response.ok) {
    return false
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileNameOf(response.headers.get('content-disposition'))
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
  return true
}
