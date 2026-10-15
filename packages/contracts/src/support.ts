import {
  locales,
  needsCustomSubject,
  supportAttachmentLimits,
  supportAttachmentMaxBytes,
  supportAttachmentTypes,
  supportLimits,
  supportRequesterRoles,
  supportSubjects,
  supportTicketStatuses,
} from '@mycogni/domain'
import { z } from 'zod'

const timestamp = z.iso.datetime({ offset: true })

export const supportSubjectSchema = z.enum(supportSubjects)

export const supportTicketStatusSchema = z.enum(supportTicketStatuses)

export const supportRequesterRoleSchema = z.enum(supportRequesterRoles)

const attachmentTypeSchema = z.enum(supportAttachmentTypes)

export const newSupportAttachmentSchema = z
  .object({
    path: z.string().min(1).max(200),
    fileName: z.string().trim().min(1).max(supportAttachmentLimits.fileName),
    contentType: attachmentTypeSchema,
    sizeBytes: z.int().positive(),
  })
  .refine(({ contentType, sizeBytes }) => sizeBytes <= supportAttachmentMaxBytes(contentType), {
    message: 'The attachment is larger than allowed for its type',
    path: ['sizeBytes'],
  })

export const createSupportTicketSchema = z
  .object({
    subject: supportSubjectSchema,
    customSubject: z
      .string()
      .trim()
      .min(supportLimits.customSubjectMin)
      .max(supportLimits.customSubjectMax)
      .nullable(),
    message: z.string().trim().min(supportLimits.messageMin).max(supportLimits.messageMax),
    role: supportRequesterRoleSchema,
    locale: z.enum(locales),
    attachment: newSupportAttachmentSchema.nullable(),
  })
  .refine(
    ({ subject, customSubject }) => needsCustomSubject(subject) === (customSubject !== null),
    {
      message: 'Write the subject only when choosing another subject',
      path: ['customSubject'],
    },
  )

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>

export const supportAttachmentSchema = z.object({
  fileName: z.string(),
  contentType: attachmentTypeSchema,
  sizeBytes: z.int().positive(),
})

export type SupportAttachment = z.infer<typeof supportAttachmentSchema>

export const supportTicketSchema = z.object({
  id: z.uuid(),
  number: z.int().positive(),
  subject: supportSubjectSchema,
  customSubject: z.string().nullable(),
  message: z.string(),
  role: supportRequesterRoleSchema,
  status: supportTicketStatusSchema,
  attachment: supportAttachmentSchema.nullable(),
  closingNote: z.string().nullable(),
  createdAt: timestamp,
  takenAt: timestamp.nullable(),
  closedAt: timestamp.nullable(),
})

export type SupportTicket = z.infer<typeof supportTicketSchema>

export const supportTicketListSchema = z.array(supportTicketSchema)

export const createdSupportTicketSchema = z.object({
  ticket: supportTicketSchema,
  emailSent: z.boolean(),
})

export type CreatedSupportTicket = z.infer<typeof createdSupportTicketSchema>

export const adminSupportTicketSchema = supportTicketSchema.extend({
  locale: z.enum(locales),
  requester: z.object({ name: z.string().nullable(), email: z.string().nullable() }),
})

export type AdminSupportTicket = z.infer<typeof adminSupportTicketSchema>

export const adminSupportTicketListSchema = z.array(adminSupportTicketSchema)

export const adminSupportQuerySchema = z.object({
  status: supportTicketStatusSchema.optional(),
})

export type AdminSupportQuery = z.infer<typeof adminSupportQuerySchema>

export const changeSupportStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('in_progress') }),
  z.object({
    status: z.literal('closed'),
    note: z.string().trim().max(supportLimits.closingNote).optional(),
  }),
])

export type ChangeSupportStatusInput = z.infer<typeof changeSupportStatusSchema>
