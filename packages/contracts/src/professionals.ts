import {
  professionalDocumentLimits,
  professionalDocumentTypes,
  professionalKinds,
  professionalStatuses,
  requiresRegistration,
} from '@mycogni/domain'
import { z } from 'zod'

const timestamp = z.iso.datetime({ offset: true })

export const professionalKindSchema = z.enum(professionalKinds)

export const professionalDocumentSchema = z.object({
  id: z.uuid(),
  fileName: z.string(),
  contentType: z.enum(professionalDocumentTypes),
  sizeBytes: z.int().positive(),
  createdAt: timestamp,
})

export type ProfessionalDocument = z.infer<typeof professionalDocumentSchema>

export const submitProfessionalDocumentSchema = z.object({
  path: z.string().min(1).max(200),
  fileName: z.string().trim().min(1).max(professionalDocumentLimits.fileName),
  contentType: z.enum(professionalDocumentTypes),
  sizeBytes: z.int().positive().max(professionalDocumentLimits.bytes),
})

export type SubmitProfessionalDocumentInput = z.infer<typeof submitProfessionalDocumentSchema>

export const registerProfessionalSchema = z
  .object({
    kind: professionalKindSchema,
    fullName: z.string().trim().min(3).max(120),
    registration: z.string().trim().min(3).max(40).nullable(),
  })
  .refine(({ kind, registration }) => !requiresRegistration(kind) || registration !== null, {
    message: 'This profession needs a council registration',
    path: ['registration'],
  })

export type RegisterProfessionalInput = z.infer<typeof registerProfessionalSchema>

export const professionalProfileSchema = z.object({
  kind: professionalKindSchema,
  fullName: z.string(),
  registration: z.string().nullable(),
  status: z.enum(professionalStatuses),
  reviewNote: z.string().nullable(),
  createdAt: timestamp,
  verifiedAt: timestamp.nullable(),
  reviewedAt: timestamp.nullable(),
  document: professionalDocumentSchema.nullable(),
})

export type ProfessionalProfile = z.infer<typeof professionalProfileSchema>

export const updateProfessionalSchema = z
  .object({ fullName: z.string().trim().min(3).max(120) })
  .strict()

export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>
