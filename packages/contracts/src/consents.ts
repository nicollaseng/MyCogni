import { consentKinds } from '@mycogni/domain'
import { z } from 'zod'

export const consentKindSchema = z.enum(consentKinds)

export const consentSchema = z.object({
  kind: consentKindSchema,
  version: z.string(),
  grantedAt: z.iso.datetime({ offset: true }),
})

export type Consent = z.infer<typeof consentSchema>

export const consentListSchema = z.array(consentSchema)

export const grantConsentsSchema = z.object({
  kinds: z.array(consentKindSchema).min(1).max(consentKinds.length),
})

export type GrantConsentsInput = z.infer<typeof grantConsentsSchema>
