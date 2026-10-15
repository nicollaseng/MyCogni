import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { downloadReport, fileNameOf, reportQuery } from './download'

interface FakeResponse {
  ok: boolean
  headers: Headers
  blob: () => Promise<Blob>
}

const replaced = [
  [globalThis, 'fetch'],
  [URL, 'createObjectURL'],
  [URL, 'revokeObjectURL'],
] as const

const originals = replaced.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key))

function respond(response: FakeResponse) {
  const fetchMock = jest.fn<(input: string, init: RequestInit) => Promise<FakeResponse>>(() =>
    Promise.resolve(response),
  )
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock })
  return fetchMock
}

describe('report download', () => {
  let clicked: string[]

  beforeEach(() => {
    clicked = []
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: () => 'blob:report',
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined })
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    replaced.forEach(([target, key], index) => {
      const original = originals[index]
      if (original === undefined) {
        Reflect.deleteProperty(target, key)
      } else {
        Object.defineProperty(target, key, original)
      }
    })
  })

  it('asks for the period and the parts chosen', () => {
    expect(reportQuery({ days: 7, notes: true, reading: false })).toBe(
      'days=7&notes=true&reading=false',
    )
  })

  it('keeps the file name the server gives', () => {
    expect(fileNameOf('attachment; filename="mycogni-relatorio-2026-10-15.pdf"')).toBe(
      'mycogni-relatorio-2026-10-15.pdf',
    )
    expect(fileNameOf(null)).toBe('mycogni.pdf')
  })

  it('saves the PDF under the server’s file name', async () => {
    const fetchMock = respond({
      ok: true,
      headers: new Headers({
        'content-disposition': 'attachment; filename="mycogni-report-2026-10-15.pdf"',
      }),
      blob: () => Promise.resolve(new Blob(['%PDF-'])),
    })

    await expect(
      downloadReport('/patterns/report', { days: 30, notes: false, reading: true }),
    ).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledWith('/patterns/report?days=30&notes=false&reading=true', {
      cache: 'no-store',
    })
    expect(clicked).toEqual(['mycogni-report-2026-10-15.pdf'])
  })

  it('reports a refused download without saving anything', async () => {
    respond({ ok: false, headers: new Headers(), blob: () => Promise.resolve(new Blob()) })

    await expect(
      downloadReport('/patterns/report', { days: 7, notes: false, reading: false }),
    ).resolves.toBe(false)
    expect(clicked).toEqual([])
  })
})
