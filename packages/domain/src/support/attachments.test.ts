import { describe, expect, it } from '@jest/globals'
import {
  isConvertibleSupportImage,
  isOwnSupportAttachmentPath,
  isSupportAttachmentType,
  supportAttachmentExtension,
  supportAttachmentKind,
  supportAttachmentLimits,
  supportAttachmentMaxBytes,
  supportAttachmentName,
  supportAttachmentProblem,
  supportAttachmentTypes,
} from './attachments.ts'

const user = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'
const file = 'd2c7a3b1-5e6f-4a8b-9c0d-1e2f3a4b5c6d'
const { imageBytes, fileBytes } = supportAttachmentLimits

describe('support attachments', () => {
  it('takes photos and plain documents, never programs or archives', () => {
    expect(supportAttachmentTypes.every(isSupportAttachmentType)).toBe(true)
    for (const type of [
      'application/x-msdownload',
      'application/zip',
      'text/html',
      'image/svg+xml',
      'image/heic',
    ]) {
      expect(isSupportAttachmentType(type)).toBe(false)
    }
  })

  it('converts iPhone photos before sending them', () => {
    expect(isConvertibleSupportImage('image/heic')).toBe(true)
    expect(isConvertibleSupportImage('image/heif')).toBe(true)
    expect(isConvertibleSupportImage('image/png')).toBe(false)
  })

  it('accepts a photo of up to 5 MB and a file of up to 2 MB', () => {
    expect(supportAttachmentKind('image/webp')).toBe('image')
    expect(supportAttachmentKind('application/pdf')).toBe('file')
    expect(supportAttachmentMaxBytes('image/jpeg')).toBe(imageBytes)
    expect(supportAttachmentMaxBytes('text/plain')).toBe(fileBytes)
    expect(supportAttachmentProblem({ type: 'image/png', size: imageBytes })).toBeNull()
    expect(supportAttachmentProblem({ type: 'image/png', size: imageBytes + 1 })).toBe('size')
    expect(supportAttachmentProblem({ type: 'application/pdf', size: fileBytes })).toBeNull()
    expect(supportAttachmentProblem({ type: 'application/pdf', size: fileBytes + 1 })).toBe('size')
    expect(supportAttachmentProblem({ type: 'text/plain', size: 0 })).toBe('size')
    expect(supportAttachmentProblem({ type: 'application/zip', size: 10 })).toBe('type')
  })

  it('keeps every attachment in the folder of the person who sent it', () => {
    expect(supportAttachmentExtension('text/plain')).toBe('txt')
    expect(isOwnSupportAttachmentPath(`${user}/${file}.jpg`, user)).toBe(true)
    expect(isOwnSupportAttachmentPath(`${user}/${file}.txt`, user)).toBe(true)
    expect(isOwnSupportAttachmentPath(`${file}/${user}.pdf`, user)).toBe(false)
    expect(isOwnSupportAttachmentPath(`${user}/../${file}.pdf`, user)).toBe(false)
    expect(isOwnSupportAttachmentPath(`${user}/${file}.exe`, user)).toBe(false)
  })

  it('stores a readable file name, or a plain one when nothing is left', () => {
    expect(supportAttachmentName(' tela / erro.png ', 'image/png')).toBe('tela erro.png')
    expect(supportAttachmentName('   ', 'application/pdf')).toBe('attachment.pdf')
  })
})
