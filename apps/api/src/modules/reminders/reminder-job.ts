import { dueReminderDay, isLocale, type Locale } from '@mycogni/domain'
import type { Mailer } from '../../mail/mailer.ts'
import type { PushSender } from '../../push/push-sender.ts'
import { reminderCopies } from './reminder-copy.ts'
import { reminderEmail } from './reminder-email.ts'
import type { ReminderCandidate, ReminderStore } from './reminder-store.ts'
import type { UnsubscribeTokens } from './unsubscribe-token.ts'

export interface ReminderRunResult {
  reminded: number
  pushes: number
  emails: number
  forgotten: number
}

export interface ReminderJob {
  run(): Promise<ReminderRunResult>
}

export interface ReminderJobDependencies {
  store: ReminderStore
  push: PushSender | null
  mailer: Mailer
  tokens: UnsubscribeTokens
  webUrl: string
  now: () => Date
}

const fallbackLocale: Locale = 'pt-BR'

export const reminderPath = '/zen'

export function createReminderJob({
  store,
  push,
  mailer,
  tokens,
  webUrl,
  now,
}: ReminderJobDependencies): ReminderJob {
  async function remind(candidate: ReminderCandidate, result: ReminderRunResult): Promise<void> {
    const locale = isLocale(candidate.locale) ? candidate.locale : fallbackLocale
    const copy = reminderCopies[locale]
    if (candidate.schedule.push && push !== null) {
      for (const device of await store.devices(candidate.userId)) {
        const outcome = await push.send(device, {
          title: copy.title,
          body: copy.body,
          url: reminderPath,
        })
        if (outcome === 'gone') {
          await store.forget(device.id)
          result.forgotten += 1
        } else if (outcome === 'sent') {
          await store.used(device.id)
          result.pushes += 1
        }
      }
    }
    if (candidate.schedule.email && candidate.email !== null) {
      const sent = await mailer.send(
        reminderEmail({
          to: candidate.email,
          locale,
          zenLink: `${webUrl}${reminderPath}`,
          offLink: `${webUrl}/reminders/email-off?token=${encodeURIComponent(tokens.sign(candidate.userId))}`,
        }),
      )
      result.emails += sent ? 1 : 0
    }
    await store.notify(candidate.userId)
    result.reminded += 1
  }

  return {
    async run() {
      const moment = now()
      const result: ReminderRunResult = { reminded: 0, pushes: 0, emails: 0, forgotten: 0 }
      for (const candidate of await store.candidates()) {
        const day = dueReminderDay(candidate.schedule, moment, candidate.timezone)
        if (day !== null && (await store.claim(candidate.userId, day))) {
          await remind(candidate, result)
        }
      }
      return result
    },
  }
}
