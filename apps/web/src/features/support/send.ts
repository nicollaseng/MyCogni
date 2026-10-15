import { isConvertibleSupportImage, type SupportRequesterRole } from '@mycogni/domain'
import { z } from 'zod'
import {
  attachmentIssue,
  type AttachmentIssue,
  type SendFailure,
  type SendResult,
  type TicketValues,
} from './form'

export type Prepared = { ok: true; file: File } | { ok: false; issue: AttachmentIssue }

export type PrepareAttachment = (file: File) => Promise<Prepared>

export type SendTicket = (
  values: TicketValues,
  role: SupportRequesterRole,
  attachment: File | null,
) => Promise<SendResult>

const sentSchema = z.object({ id: z.uuid(), number: z.int(), emailSent: z.boolean() })

const failures: Readonly<Partial<Record<number, SendFailure>>> = {
  413: 'size',
  415: 'type',
  429: 'limit',
}

async function toJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('Canvas is not available')
  }
  context.drawImage(bitmap, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88)
  })
  if (blob === null) {
    throw new Error('The photo could not be converted')
  }
  return new File([blob], `${file.name.replace(/\.[^.]*$/, '') || 'photo'}.jpg`, {
    type: 'image/jpeg',
  })
}

export const prepareAttachment: PrepareAttachment = async (file) => {
  let ready = file
  if (isConvertibleSupportImage(file.type)) {
    try {
      ready = await toJpeg(file)
    } catch {
      return { ok: false, issue: 'convert' }
    }
  }
  const issue = attachmentIssue(ready)
  return issue === null ? { ok: true, file: ready } : { ok: false, issue }
}

export const sendTicket: SendTicket = async (values, role, attachment) => {
  const body = new FormData()
  body.set('subject', values.subject ?? '')
  body.set('customSubject', values.customSubject)
  body.set('message', values.message)
  body.set('role', role)
  if (attachment !== null) {
    body.set('attachment', attachment)
  }
  try {
    const response = await fetch('/uploads/support', { method: 'POST', body })
    if (!response.ok) {
      return { ok: false, problem: failures[response.status] ?? 'failed' }
    }
    const sent = sentSchema.safeParse(await response.json())
    return sent.success ? { ok: true, ticket: sent.data } : { ok: false, problem: 'failed' }
  } catch {
    return { ok: false, problem: 'failed' }
  }
}
