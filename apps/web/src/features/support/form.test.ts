import { describe, expect, it } from '@jest/globals'
import { supportAttachmentLimits } from '@mycogni/domain'
import { attachmentIssue, emptyTicket, subjectOf, ticketIssues } from './form'

const message = 'O app fecha sozinho quando abro os registros.'

describe('ticketIssues', () => {
  it('asks for a subject and a message long enough', () => {
    expect(ticketIssues(emptyTicket)).toEqual(['subject', 'message'])
    expect(ticketIssues({ subject: 'billing', customSubject: '', message })).toEqual([])
  })

  it('asks for the written subject only when another subject is chosen', () => {
    expect(ticketIssues({ subject: 'other', customSubject: ' ab ', message })).toEqual([
      'customSubject',
    ])
    expect(ticketIssues({ subject: 'other', customSubject: 'Exportar dados', message })).toEqual([])
  })
})

describe('attachmentIssue', () => {
  const { imageBytes, fileBytes } = supportAttachmentLimits

  it('names the limit of a photo or of a file', () => {
    expect(attachmentIssue({ type: 'image/webp', size: imageBytes })).toBeNull()
    expect(attachmentIssue({ type: 'image/jpeg', size: imageBytes + 1 })).toBe('imageSize')
    expect(attachmentIssue({ type: 'text/plain', size: fileBytes })).toBeNull()
    expect(attachmentIssue({ type: 'application/pdf', size: fileBytes + 1 })).toBe('fileSize')
    expect(attachmentIssue({ type: 'application/x-msdownload', size: 10 })).toBe('type')
  })
})

describe('subjectOf', () => {
  it('reads only the listed subjects', () => {
    expect(subjectOf('privacy')).toBe('privacy')
    expect(subjectOf('')).toBeNull()
    expect(subjectOf('hack')).toBeNull()
  })
})
