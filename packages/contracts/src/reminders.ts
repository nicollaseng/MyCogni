import { isReminderTime } from '@mycogni/domain'
import { z } from 'zod'

const weekDaysSchema = z.array(z.int().min(0).max(6)).min(1).max(7)

export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  time: z.string().refine(isReminderTime, 'Use a time such as 20:00'),
  days: weekDaysSchema,
  push: z.boolean(),
  email: z.boolean(),
})

export type ReminderSettings = z.infer<typeof reminderSettingsSchema>

export const updateReminderSettingsSchema = reminderSettingsSchema.extend({
  days: weekDaysSchema.transform((days) =>
    [...new Set(days)].sort((first, second) => first - second),
  ),
})

export const reminderOverviewSchema = z.object({
  settings: reminderSettingsSchema,
  pushKey: z.string().nullable(),
  devices: z.int().min(0),
})

export type ReminderOverview = z.infer<typeof reminderOverviewSchema>

export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
})

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>

export const removePushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2000),
})

export type RemovePushSubscriptionInput = z.infer<typeof removePushSubscriptionSchema>

export const reminderUnsubscribeSchema = z.object({ token: z.string().min(10).max(200) })

export type ReminderUnsubscribeInput = z.infer<typeof reminderUnsubscribeSchema>

export const exportedReminderSchema = z.object({
  settings: reminderSettingsSchema.nullable(),
  devices: z.array(z.object({ createdAt: z.iso.datetime({ offset: true }) })),
})
