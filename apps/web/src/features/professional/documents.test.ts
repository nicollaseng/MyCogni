import { describe, expect, it } from '@jest/globals'
import { documentFormat, documentStateOf, formatFileSize } from './documents'

const document = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000041',
  fileName: 'CRP.pdf',
  contentType: 'application/pdf' as const,
  sizeBytes: 2048,
  createdAt: '2026-10-14T12:00:00Z',
}

describe('documents', () => {
  it('tells apart a missing document from one under review, approved or rejected', () => {
    expect(documentStateOf({ status: 'pending', document: null })).toBe('missing')
    expect(documentStateOf({ status: 'pending', document })).toBe('pending')
    expect(documentStateOf({ status: 'rejected', document })).toBe('rejected')
  })

  it('shows the size and the format of the file in the language of the page', () => {
    expect(formatFileSize(2048, 'pt-BR')).toBe('2 kB')
    expect(formatFileSize(1.5 * 1024 * 1024, 'en-US')).toBe('1.5 MB')
    expect(documentFormat({ contentType: 'image/jpeg' })).toBe('JPG')
  })
})
