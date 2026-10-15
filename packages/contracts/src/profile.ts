import { locales } from '@mycogni/domain'
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
  displayName: z.string().nullable(),
  avatarPath: z.string().nullable(),
  timezone: z.string(),
  locale: z.enum(locales).nullable(),
  onboardingCompletedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type Profile = z.infer<typeof profileSchema>

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().refine(isTimeZone, 'Invalid time zone').optional(),
  locale: z.enum(locales).optional(),
  avatarPath: z.string().min(1).max(200).nullable().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
