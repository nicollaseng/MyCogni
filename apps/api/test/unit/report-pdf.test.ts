import { describe, expect, it } from '@jest/globals'
import { buildReportModel, type ReportCheckIn } from '../../src/modules/reports/report-model.ts'
import { renderReportPdf } from '../../src/modules/reports/report-pdf.ts'
import { isPdf, pageCount } from '../support/pdf.ts'

const now = new Date('2026-10-15T18:00:00Z')

const month: ReportCheckIn[] = Array.from({ length: 30 }, (_, index) => ({
  moodLevel: (index * 5) % 7,
  emotions: ['calm', 'anxiety'].slice(index % 2),
  contexts: ['work'],
  note: `Nota do dia ${String(index)}. `.repeat(12),
  recordedAt: new Date(now.getTime() - index * 24 * 60 * 60 * 1000),
}))

function render(includeNotes: boolean, checkIns: readonly ReportCheckIn[] = month) {
  return renderReportPdf(
    buildReportModel({
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
      now,
      days: 30,
      name: 'Marina Costa',
      checkIns,
      screenings: [],
      readings: [],
      includeNotes,
    }),
  )
}

describe('renderReportPdf', () => {
  it('writes an A4 PDF with the embedded typefaces', async () => {
    const pdf = await render(false)

    expect(isPdf(pdf)).toBe(true)
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1)
    expect(pdf.toString('latin1')).toContain('/MediaBox [0 0 595.28 841.89]')
    expect(pdf.toString('latin1')).toMatch(/\/FontName \/[A-Z]{6}\+Newsreader/)
    expect(pdf.toString('latin1')).toMatch(/\/FontName \/[A-Z]{6}\+SchibstedGrotesk/)
  })

  it('flows long notes onto more pages only when they are included', async () => {
    const without = pageCount(await render(false))
    const withNotes = pageCount(await render(true))

    expect(withNotes).toBeGreaterThan(without)
  })

  it('renders an empty period on a single page', async () => {
    expect(pageCount(await render(true, []))).toBe(1)
  })
})
