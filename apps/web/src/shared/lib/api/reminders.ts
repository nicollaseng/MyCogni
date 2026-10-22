import {
  reminderOverviewSchema,
  type PushSubscriptionInput,
  type ReminderOverview,
  type ReminderSettings,
} from '@mycogni/contracts'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest } from './client'

export const fetchReminders = cache((): Promise<ReminderOverview> =>
  apiRequest({ path: '/v1/reminders', schema: reminderOverviewSchema }),
)

export function saveReminders(body: ReminderSettings): Promise<ReminderOverview> {
  return apiRequest({ path: '/v1/reminders', schema: reminderOverviewSchema, method: 'PUT', body })
}

export async function subscribePush(body: PushSubscriptionInput): Promise<void> {
  await apiRequest({ path: '/v1/push/subscriptions', schema: z.null(), method: 'POST', body })
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await apiRequest({
    path: '/v1/push/subscriptions',
    schema: z.null(),
    method: 'DELETE',
    body: { endpoint },
  })
}

export async function turnEmailRemindersOff(token: string): Promise<boolean> {
  try {
    await apiRequest({
      path: '/v1/public/reminders/email-off',
      schema: z.null(),
      method: 'POST',
      body: { token },
      anonymous: true,
    })
    return true
  } catch {
    return false
  }
}
