import {
  professionalCouncils,
  professionalDocumentLimits,
  professionalStatuses,
  reviewDecisions,
} from '@mycogni/domain'
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
  council: z.enum(professionalCouncils).nullable(),
  registrationNeedsReview: z.boolean(),
  email: z.string().nullable(),
  status: z.enum(professionalStatuses),
  reviewNote: z.string().nullable(),
  createdAt: timestamp,
  verifiedAt: timestamp.nullable(),
  reviewedAt: timestamp.nullable(),
  hasPhoto: z.boolean(),
  activeLinks: z.int().min(0),
  pendingInvitations: z.int().min(0),
  document: professionalDocumentSchema.nullable(),
})

export type ProfessionalForReview = z.infer<typeof professionalForReviewSchema>

export const professionalForReviewListSchema = z.array(professionalForReviewSchema)

export const professionalReviewEntrySchema = z.object({
  id: z.uuid(),
  decision: z.enum(reviewDecisions),
  note: z.string().nullable(),
  adminEmail: z.string().nullable(),
  createdAt: timestamp,
})

export type ProfessionalReviewEntry = z.infer<typeof professionalReviewEntrySchema>

export const professionalReviewDetailSchema = professionalForReviewSchema.extend({
  photoUrl: z.url().nullable(),
  history: z.array(professionalReviewEntrySchema),
})

export type ProfessionalReviewDetail = z.infer<typeof professionalReviewDetailSchema>

const reviewNoteSchema = z.string().trim().max(professionalDocumentLimits.reviewNote)

export const reviewProfessionalSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('verified'), note: reviewNoteSchema.optional() }),
  z.object({ status: z.literal('rejected'), note: reviewNoteSchema.min(3) }),
])

export type ReviewProfessionalInput = z.infer<typeof reviewProfessionalSchema>

export const documentLinkSchema = z.object({ url: z.url(), expiresAt: timestamp })

export type DocumentLink = z.infer<typeof documentLinkSchema>
