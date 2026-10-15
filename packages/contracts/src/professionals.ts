import { professionalKinds, professionalStatuses, requiresRegistration } from '@mycogni/domain'
import { z } from 'zod'

export const professionalKindSchema = z.enum(professionalKinds)

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
  createdAt: z.iso.datetime({ offset: true }),
  verifiedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type ProfessionalProfile = z.infer<typeof professionalProfileSchema>

export const updateProfessionalSchema = z
  .object({ fullName: z.string().trim().min(3).max(120) })
  .strict()

export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>
