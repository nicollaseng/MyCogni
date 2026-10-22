import { reminderDefaults } from '@mycogni/domain'
import type { ReactNode } from 'react'
import { acceptReminderOffer } from '@/features/reminders/actions'
import { ReminderOfferProvider } from '@/features/reminders/components/reminder-offer'
import { fetchReminders } from '@/shared/lib/api/reminders'

export default async function ZenLayout({ children }: Readonly<{ children: ReactNode }>) {
  const overview = await fetchReminders().catch(() => null)
  return (
    <ReminderOfferProvider
      offer={overview !== null && !overview.settings.enabled}
      time={overview?.settings.time ?? reminderDefaults.time}
      accept={acceptReminderOffer}
    >
      {children}
    </ReminderOfferProvider>
  )
}
