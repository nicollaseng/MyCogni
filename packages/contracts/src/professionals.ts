import {
  brazilianStates,
  councilOf,
  emergencyWhatsappPattern,
  institutionRegistrationLimits,
  professionalDocumentLimits,
  professionalDocumentTypes,
  professionalKinds,
  professionalStatuses,
  registrationNumberPattern,
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

export const councilRegistrationInputSchema = z.object({
  uf: z.enum(brazilianStates),
  number: z.string().trim().regex(registrationNumberPattern),
})

export type CouncilRegistrationInput = z.infer<typeof councilRegistrationInputSchema>

export const registerProfessionalSchema = z
  .object({
    kind: professionalKindSchema,
    fullName: z.string().trim().min(3).max(120),
    registration: councilRegistrationInputSchema.nullable(),
    institutionRegistration: z
      .string()
      .trim()
      .min(institutionRegistrationLimits.min)
      .max(institutionRegistrationLimits.max)
      .nullable()
      .default(null),
  })
  .refine(({ kind, registration }) => (councilOf(kind) === null) === (registration === null), {
    message: 'Council professions need their council registration and psychoanalysts have none',
    path: ['registration'],
  })
  .refine(
    ({ kind, institutionRegistration }) =>
      councilOf(kind) === null || institutionRegistration === null,
    {
      message: 'Only psychoanalysts add the registration of their institution',
      path: ['institutionRegistration'],
    },
  )

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
  emergencyWhatsapp: z.string().nullable(),
  document: professionalDocumentSchema.nullable(),
})

export type ProfessionalProfile = z.infer<typeof professionalProfileSchema>

export const updateProfessionalSchema = z
  .object({ fullName: z.string().trim().min(3).max(120) })
  .strict()

export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>

export const emergencyWhatsappSchema = z.object({
  emergencyWhatsapp: z.string().regex(emergencyWhatsappPattern).nullable(),
})

export type EmergencyWhatsappInput = z.infer<typeof emergencyWhatsappSchema>
