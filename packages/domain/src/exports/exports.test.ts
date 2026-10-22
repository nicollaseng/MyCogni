import { describe, expect, it } from '@jest/globals'
import {
  csvDocument,
  csvField,
  dataExportLimits,
  escapeHtml,
  exportExpiry,
  fileSlug,
  isActiveExport,
  isDownloadable,
  uniqueName,
} from './exports.ts'

describe('export status', () => {
  it('knows which exports are still being prepared', () => {
    expect(isActiveExport('queued')).toBe(true)
    expect(isActiveExport('running')).toBe(true)
    expect(isActiveExport('ready')).toBe(false)
    expect(isActiveExport('failed')).toBe(false)
  })

  it('keeps a ready export for seven days', () => {
    const ready = new Date('2026-10-22T12:00:00Z')
    expect(dataExportLimits.availableDays).toBe(7)
    expect(exportExpiry(ready).toISOString()).toBe('2026-10-29T12:00:00.000Z')
  })

  it('downloads only a ready export that has not expired', () => {
    const now = new Date('2026-10-25T12:00:00Z')
    const later = new Date('2026-10-29T12:00:00Z')
    expect(isDownloadable({ status: 'ready', expiresAt: later }, now)).toBe(true)
    expect(isDownloadable({ status: 'ready', expiresAt: now }, now)).toBe(false)
    expect(isDownloadable({ status: 'ready', expiresAt: null }, now)).toBe(false)
    expect(isDownloadable({ status: 'expired', expiresAt: later }, now)).toBe(false)
  })
})

describe('csv', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvField('simples')).toBe('simples')
    expect(csvField('um, dois')).toBe('"um, dois"')
    expect(csvField('disse "oi"')).toBe('"disse ""oi"""')
    expect(csvField('linha\nnova')).toBe('"linha\nnova"')
    expect(csvField(4)).toBe('4')
    expect(csvField(true)).toBe('true')
    expect(csvField(null)).toBe('')
  })

  it('stops spreadsheet formulas from running', () => {
    expect(csvField('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"')
    expect(csvField('+1')).toBe("'+1")
    expect(csvField('-2')).toBe("'-2")
    expect(csvField('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvField(-2)).toBe('-2')
  })

  it('writes a document that spreadsheets open as UTF-8', () => {
    expect(csvDocument(['dia', 'nota'], [['2026-10-22', 'Ótimo, dormi bem']])).toBe(
      '\uFEFFdia,nota\r\n2026-10-22,"Ótimo, dormi bem"\r\n',
    )
  })
})

describe('html', () => {
  it('escapes everything that could become markup', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'y\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    )
  })
})

describe('file names', () => {
  it('turns a title into a short safe name', () => {
    expect(fileSlug('Conversa difícil com a Ana!', 'pagina')).toBe('conversa-dificil-com-a-ana')
    expect(fileSlug('../../etc/passwd', 'pagina')).toBe('etc-passwd')
    expect(fileSlug(null, 'pagina')).toBe('pagina')
    expect(fileSlug('😊', 'pagina')).toBe('pagina')
    expect(fileSlug('a'.repeat(47) + ' bc', 'pagina')).toBe('a'.repeat(47))
  })

  it('never repeats a name inside the archive', () => {
    const used = new Set<string>()
    expect(uniqueName('2026-10-22-dia.html', used)).toBe('2026-10-22-dia.html')
    expect(uniqueName('2026-10-22-dia.html', used)).toBe('2026-10-22-dia-2.html')
    expect(uniqueName('2026-10-22-dia.html', used)).toBe('2026-10-22-dia-3.html')
    expect(uniqueName('LEIA-ME', used)).toBe('LEIA-ME')
    expect(uniqueName('LEIA-ME', used)).toBe('LEIA-ME-2')
  })
})
