import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/features/account/components/settings-page'
import { voicePreviews } from '@/features/account/voice-previews'
import { SoundAndVoiceSettings } from '@/features/audio/components/sound-and-voice-settings'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('sound') }
}

export default async function SoundPage() {
  const [, [previews, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([voicePreviews(), getTranslations('account.nav')]),
  )

  return (
    <SettingsPage title={t('sound')} ownTitles="hidden">
      <SoundAndVoiceSettings previews={previews} />
    </SettingsPage>
  )
}
