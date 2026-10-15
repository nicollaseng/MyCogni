import { professionalStatuses } from '@mycogni/domain'
import { z } from 'zod'
import { professionalKindSchema } from './professionals.ts'

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
  createdAt: timestamp,
  verifiedAt: timestamp.nullable(),
})

export type ProfessionalForReview = z.infer<typeof professionalForReviewSchema>

export const professionalForReviewListSchema = z.array(professionalForReviewSchema)

export const reviewProfessionalSchema = z.object({
  status: z.enum(['verified', 'rejected']),
})

export type ReviewProfessionalInput = z.infer<typeof reviewProfessionalSchema>
