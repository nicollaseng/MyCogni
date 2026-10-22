import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { setConsent, setJournalInInsights } from '@/features/account/actions'
import { ConsentList } from '@/features/account/components/consent-list'
import { JournalInsightsSwitch } from '@/features/account/components/journal-insights-switch'
import { SettingsPage } from '@/features/account/components/settings-page'
import { setMemoriesEnabled } from '@/features/memories/actions'
import { MemoriesSwitch } from '@/features/memories/components/memories-switch'
import { Panel, Section } from '@/shared/components/section'
import { fetchConsents } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account.nav')
  return { title: t('privacy') }
}

export default async function PrivacyPage() {
  const [profile, [consents, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchConsents(), getTranslations('account')]),
  )

  return (
    <SettingsPage title={t('nav.privacy')}>
      <div className="space-y-3">
        <Panel>
          <ConsentList consents={consents} timeZone={profile.timezone} setConsent={setConsent} />
          <JournalInsightsSwitch
            enabled={profile.journalInInsights}
            setJournalInInsights={setJournalInInsights}
          />
          <MemoriesSwitch
            enabled={profile.memoriesEnabled}
            setMemoriesEnabled={setMemoriesEnabled}
          />
        </Panel>
        <p className="text-sm text-pretty text-muted-foreground">{t('consents.note')}</p>
      </div>
      <Section title={t('sections.data')}>
        <Panel>
          <a
            href="/me/export"
            download
            className="block py-3.5 underline decoration-1 underline-offset-4"
          >
            {t('data.export')}
          </a>
        </Panel>
      </Section>
    </SettingsPage>
  )
}
