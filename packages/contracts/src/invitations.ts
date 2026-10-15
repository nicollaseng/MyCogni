import {
  invitationChannels,
  invitationStatuses,
  isInvitationCode,
  locales,
  normalizeInvitationCode,
  sharingConsentVersion,
} from '@mycogni/domain'
import { z } from 'zod'
import { professionalKindSchema } from './professionals.ts'

const timestamp = z.iso.datetime({ offset: true })

export const invitationCodeSchema = z
  .string()
  .transform(normalizeInvitationCode)
  .refine(isInvitationCode, 'Invalid invitation code')

export const professionalSummarySchema = z.object({
  name: z.string(),
  kind: professionalKindSchema,
  registration: z.string().nullable(),
})

export type ProfessionalSummary = z.infer<typeof professionalSummarySchema>

export const linkedProfessionalSchema = professionalSummarySchema.extend({
  photoUrl: z.url().nullable(),
})

export type LinkedProfessional = z.infer<typeof linkedProfessionalSchema>

export const createInvitationSchema = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('email'),
    recipientEmail: z.string().trim().toLowerCase().pipe(z.email()),
    locale: z.enum(locales),
  }),
  z.object({ channel: z.literal('link'), locale: z.enum(locales) }),
])

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>

export const resendInvitationSchema = z.object({ locale: z.enum(locales) })

export type ResendInvitationInput = z.infer<typeof resendInvitationSchema>

export const sentInvitationSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  channel: z.enum(invitationChannels),
  recipientEmail: z.string().nullable(),
  status: z.enum(invitationStatuses),
  createdAt: timestamp,
  expiresAt: timestamp,
  respondedAt: timestamp.nullable(),
  link: z.url(),
})

export type SentInvitation = z.infer<typeof sentInvitationSchema>

export const sentInvitationListSchema = z.array(sentInvitationSchema)

export const createdInvitationSchema = z.object({
  invitation: sentInvitationSchema,
  emailSent: z.boolean(),
})

export type CreatedInvitation = z.infer<typeof createdInvitationSchema>

export const invitationPreviewSchema = z.object({
  professional: linkedProfessionalSchema.pick({ name: true, kind: true, photoUrl: true }),
  status: z.enum(invitationStatuses),
  expiresAt: timestamp,
})

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>

export const claimInvitationSchema = z.object({ code: invitationCodeSchema })

export type ClaimInvitationInput = z.infer<typeof claimInvitationSchema>

export const receivedInvitationSchema = z.object({
  id: z.uuid(),
  professional: professionalSummarySchema,
  status: z.enum(invitationStatuses),
  createdAt: timestamp,
  expiresAt: timestamp,
  respondedAt: timestamp.nullable(),
})

export type ReceivedInvitation = z.infer<typeof receivedInvitationSchema>

export const receivedInvitationListSchema = z.array(receivedInvitationSchema)

export const attachedInvitationsSchema = z.object({ attached: z.int().min(0) })

export const acceptInvitationSchema = z.object({
  sharesHistory: z.boolean(),
  consentVersion: z.literal(sharingConsentVersion),
})

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
