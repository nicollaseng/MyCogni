import { professionalDocumentLimits, professionalStatuses } from '@mycogni/domain'
import { z } from 'zod'
import { professionalDocumentSchema, professionalKindSchema } from './professionals.ts'

const timestamp = z.iso.datetime({ offset: true })

export const professionalReviewQuerySchema = z.object({
  status: z.enum(professionalStatuses).default('pending'),
})

export type ProfessionalReviewQuery = z.infer<typeof professionalReviewQuerySchema>

export const professionalForReviewSchema = z.object({
  userId: z.uuid(),
  kind: professionalKindSchema,
  fullName: z.string(),
  registration: z.string().nullable(),
  email: z.string().nullable(),
  status: z.enum(professionalStatuses),
  reviewNote: z.string().nullable(),
  createdAt: timestamp,
  verifiedAt: timestamp.nullable(),
  reviewedAt: timestamp.nullable(),
  document: professionalDocumentSchema.nullable(),
})

export type ProfessionalForReview = z.infer<typeof professionalForReviewSchema>

export const professionalForReviewListSchema = z.array(professionalForReviewSchema)

const reviewNoteSchema = z.string().trim().max(professionalDocumentLimits.reviewNote)

export const reviewProfessionalSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('verified'), note: reviewNoteSchema.optional() }),
  z.object({ status: z.literal('rejected'), note: reviewNoteSchema.min(3) }),
])

export type ReviewProfessionalInput = z.infer<typeof reviewProfessionalSchema>

export const documentLinkSchema = z.object({ url: z.url(), expiresAt: timestamp })

export type DocumentLink = z.infer<typeof documentLinkSchema>
