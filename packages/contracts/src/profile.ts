import { accountTypes, locales } from '@mycogni/domain'
import { z } from 'zod'

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export const profileSchema = z.object({
  id: z.uuid(),
  email: z.email().nullable(),
  accountType: z.enum(accountTypes),
  displayName: z.string().nullable(),
  avatarPath: z.string().nullable(),
  timezone: z.string(),
  locale: z.enum(locales).nullable(),
  journalInInsights: z.boolean(),
  memoriesEnabled: z.boolean(),
  termsOutdated: z.boolean(),
  onboardingCompletedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type Profile = z.infer<typeof profileSchema>

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().refine(isTimeZone, 'Invalid time zone').optional(),
  locale: z.enum(locales).optional(),
  journalInInsights: z.boolean().optional(),
  memoriesEnabled: z.boolean().optional(),
  avatarPath: z.string().min(1).max(200).nullable().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const adoptAccountTypeSchema = z.object({ accountType: z.literal('professional') })

export type AdoptAccountTypeInput = z.infer<typeof adoptAccountTypeSchema>

export const providerPhotoStatuses = ['imported', 'skipped', 'unavailable'] as const

export const providerPhotoImportSchema = z.object({ status: z.enum(providerPhotoStatuses) })

export type ProviderPhotoImport = z.infer<typeof providerPhotoImportSchema>
