'use server'

import {
  pushSubscriptionSchema,
  updateReminderSettingsSchema,
  type ReminderOverview,
} from '@mycogni/contracts'
import { isReminderTime, reminderDefaults } from '@mycogni/domain'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import {
  fetchReminders,
  saveReminders,
  subscribePush,
  unsubscribePush,
} from '@/shared/lib/api/reminders'

async function errorText(): Promise<string> {
  return (await getTranslations('reminders'))('error')
}

function refresh(): void {
  revalidatePath('/me', 'layout')
  revalidatePath('/zen', 'layout')
}

export async function saveReminderSettings(
  input: unknown,
): Promise<ActionResult<ReminderOverview>> {
  const parsed = updateReminderSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return failure(await errorText())
  }
  const result = await attempt(() => saveReminders(parsed.data), await errorText())
  if (result.ok) {
    refresh()
  }
  return result
}

export async function acceptReminderOffer(time: string): Promise<ActionResult<string>> {
  if (!isReminderTime(time)) {
    return failure(await errorText())
  }
  const result = await attempt(
    async () => {
      const { settings } = await fetchReminders()
      await saveReminders({
        ...settings,
        enabled: true,
        time,
        email: settings.email || !settings.push,
        days: settings.days.length === 0 ? [...reminderDefaults.days] : settings.days,
      })
      return time
    },
    await errorText(),
  )
  if (result.ok) {
    refresh()
  }
  return result
}

export async function registerDevice(subscription: unknown): Promise<ActionResult<null>> {
  const parsed = pushSubscriptionSchema.safeParse(subscription)
  if (!parsed.success) {
    return failure(await errorText())
  }
  return attempt(
    async () => {
      await subscribePush(parsed.data)
      return null
    },
    await errorText(),
  )
}

export async function forgetDevice(endpoint: string): Promise<ActionResult<null>> {
  if (!z.url().safeParse(endpoint).success) {
    return failure(await errorText())
  }
  return attempt(
    async () => {
      await unsubscribePush(endpoint)
      return null
    },
    await errorText(),
  )
}
