import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
import { forgetDevice, registerDevice, saveReminderSettings } from '@/features/reminders/actions'
import { ReminderSettings } from '@/features/reminders/components/reminder-settings'
import { fetchReminders } from '@/shared/lib/api/reminders'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reminders.meta')
  return { title: t('title') }
}

export default async function RemindersPage() {
  const [, [overview, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchReminders(), getTranslations('reminders')]),
  )

  return (
    <SettingsPage title={t('meta.title')}>
      <p className="max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">
        {t('lead')}
      </p>
      <ReminderSettings
        overview={overview}
        actions={{ save: saveReminderSettings, registerDevice, forgetDevice }}
      />
    </SettingsPage>
  )
}
