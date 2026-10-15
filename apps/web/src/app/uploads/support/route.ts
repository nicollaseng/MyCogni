import { createSupportTicketSchema } from '@mycogni/contracts'
import {
  isSupportAttachmentType,
  needsCustomSubject,
  supportAttachmentBucket,
  supportAttachmentExtension,
  supportAttachmentName,
  supportAttachmentProblem,
} from '@mycogni/domain'
import { NextResponse } from 'next/server'
import { getLocale } from 'next-intl/server'
import { ApiError } from '@/shared/lib/api/client'
import { createSupportTicket } from '@/shared/lib/api/support'
import { currentUser } from '@/shared/lib/auth/session'
import { createSupabaseServerClient } from '@/shared/lib/supabase/server'
import { refuse, refuseFile } from '@/shared/lib/upload-responses'

function text(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

function attachmentOf(form: FormData): File | null {
  const value = form.get('attachment')
  return value instanceof File && value.size > 0 ? value : null
}

function apiFailure(error: unknown): NextResponse {
  if (error instanceof ApiError && error.status === 429) {
    return refuse(429, 'SUPPORT_TICKET_LIMIT')
  }
  if (error instanceof ApiError && error.status < 500) {
    return refuse(400, 'INVALID')
  }
  console.error(error instanceof ApiError ? error.code : 'Support ticket was not sent')
  return refuse(502, 'SAVE_FAILED')
}

export async function POST(request: Request) {
  const user = await currentUser()
  if (user === null) {
    return refuse(401, 'UNAUTHORIZED')
  }
  const form = await request.formData().catch(() => null)
  if (form === null) {
    return refuse(400, 'INVALID')
  }
  const file = attachmentOf(form)
  if (file !== null && !isSupportAttachmentType(file.type)) {
    return refuseFile('type')
  }
  const problem = file === null ? null : supportAttachmentProblem(file)
  if (problem !== null) {
    return refuseFile(problem)
  }
  const subject = text(form, 'subject')
  const parsed = createSupportTicketSchema.safeParse({
    subject,
    customSubject: subject === 'other' ? text(form, 'customSubject') : null,
    message: text(form, 'message'),
    role: text(form, 'role'),
    locale: await getLocale(),
    attachment:
      file === null || !isSupportAttachmentType(file.type)
        ? null
        : {
            path: `${user.id}/${crypto.randomUUID()}.${supportAttachmentExtension(file.type)}`,
            fileName: supportAttachmentName(file.name, file.type),
            contentType: file.type,
            sizeBytes: file.size,
          },
  })
  if (
    !parsed.success ||
    (parsed.data.customSubject !== null) !== needsCustomSubject(parsed.data.subject)
  ) {
    return refuse(400, 'INVALID')
  }
  const input = parsed.data
  const storage = (await createSupabaseServerClient('read-write')).storage.from(
    supportAttachmentBucket,
  )
  if (input.attachment !== null && file !== null) {
    const uploaded = await storage.upload(input.attachment.path, file, {
      contentType: input.attachment.contentType,
    })
    if (uploaded.error !== null) {
      console.error(uploaded.error.message)
      return refuse(502, 'UPLOAD_FAILED')
    }
  }
  try {
    const { ticket, emailSent } = await createSupportTicket(input)
    return NextResponse.json({ id: ticket.id, number: ticket.number, emailSent }, { status: 201 })
  } catch (error) {
    if (input.attachment !== null) {
      await storage.remove([input.attachment.path])
    }
    return apiFailure(error)
  }
}
