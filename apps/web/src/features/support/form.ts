import {
  isSupportAttachmentType,
  needsCustomSubject,
  supportAttachmentKind,
  supportAttachmentProblem,
  supportLimits,
  supportSubjects,
  type SupportSubject,
  type UploadCandidate,
} from '@mycogni/domain'

export interface TicketValues {
  subject: SupportSubject | null
  customSubject: string
  message: string
}

export type TicketField = 'subject' | 'customSubject' | 'message'

export type AttachmentIssue = 'type' | 'imageSize' | 'fileSize' | 'convert'

export type SendFailure = 'type' | 'size' | 'limit' | 'failed'

export interface SentTicket {
  id: string
  number: number
  emailSent: boolean
}

export type SendResult = { ok: true; ticket: SentTicket } | { ok: false; problem: SendFailure }

export const emptyTicket: TicketValues = { subject: null, customSubject: '', message: '' }

export function subjectOf(value: string): SupportSubject | null {
  return supportSubjects.find((subject) => subject === value) ?? null
}

export function ticketIssues({ subject, customSubject, message }: TicketValues): TicketField[] {
  const issues: TicketField[] = []
  if (subject === null) {
    issues.push('subject')
  } else if (
    needsCustomSubject(subject) &&
    customSubject.trim().length < supportLimits.customSubjectMin
  ) {
    issues.push('customSubject')
  }
  if (message.trim().length < supportLimits.messageMin) {
    issues.push('message')
  }
  return issues
}

export function attachmentIssue(file: UploadCandidate): AttachmentIssue | null {
  if (!isSupportAttachmentType(file.type)) {
    return 'type'
  }
  if (supportAttachmentProblem(file) === null) {
    return null
  }
  return supportAttachmentKind(file.type) === 'image' ? 'imageSize' : 'fileSize'
}
