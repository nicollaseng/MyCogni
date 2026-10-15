import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { signOut } from '@/features/auth/actions'
import {
  changeEmail,
  changePassword,
  deleteMyAccount,
  refreshAfterUpload,
  renameMe,
  setAiConsent,
  setJournalInInsights,
} from '@/features/account/actions'
import { endLink } from '@/features/care/actions'
import { CareLinks } from '@/features/care/components/care-links'
import { ConsentList } from '@/features/account/components/consent-list'
import { DeleteAccount } from '@/features/account/components/delete-account'
import { EmailForm } from '@/features/account/components/email-form'
import { JournalInsightsSwitch } from '@/features/account/components/journal-insights-switch'
import { NameForm } from '@/features/account/components/name-form'
import { PasswordForm } from '@/features/account/components/password-form'
import { ProfileHeader } from '@/features/account/components/profile-header'
import { SettingsRow } from '@/features/account/components/settings-row'
import { chooseLocale } from '@/features/locale/actions'
import { LocaleSelect } from '@/features/locale/components/locale-select'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningHistory } from '@/features/screening/components/screening-history'
import { ScreeningSchedule } from '@/features/screening/components/screening-schedule'
import { latestByInstrument } from '@/features/screening/latest'
import { SupportSection } from '@/features/support/components/support-section'
import { Panel, Section } from '@/shared/components/section'
import { fetchCareLinks, fetchProfessional } from '@/shared/lib/api/care'
import { fetchAssessments, fetchConsents } from '@/shared/lib/api/resources'
import { fetchSupportTickets } from '@/shared/lib/api/support'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { ownPhotoUrl } from '@/shared/lib/photos'
import { Button } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('title') }
}

const rowLink = 'block py-3.5 underline decoration-1 underline-offset-4'

export default async function MePage() {
  const profile = await requireOnboardedProfile()
  const [assessments, consents, photoUrl, careLinks, professional, tickets, t, language] =
    await Promise.all([
      fetchAssessments(),
      fetchConsents(),
      ownPhotoUrl(profile.avatarPath),
      fetchCareLinks(),
      fetchProfessional(),
      fetchSupportTickets(),
      getTranslations('account'),
      getTranslations('common.language'),
    ])
  const lastAnswer = assessments[0]?.completedAt

  return (
    <div className="space-y-12">
      <ProfileHeader
        name={profile.displayName}
        email={profile.email}
        photoUrl={photoUrl}
        onPhotoSaved={refreshAfterUpload}
      />

      <LatestScreening results={latestByInstrument(assessments)} timeZone={profile.timezone}>
        <ScreeningHistory assessments={assessments} timeZone={profile.timezone} />
        {lastAnswer !== undefined && (
          <ScreeningSchedule
            lastAnswer={lastAnswer}
            now={new Date()}
            timeZone={profile.timezone}
            offerRetake="always"
          />
        )}
      </LatestScreening>

      <CareLinks
        links={careLinks}
        timeZone={profile.timezone}
        end={endLink}
        isProfessional={professional !== null}
      />

      <Section title={t('sections.account')}>
        <Panel>
          <SettingsRow label={t('name.label')} value={profile.displayName ?? t('name.empty')}>
            <NameForm initialName={profile.displayName ?? ''} rename={renameMe} />
          </SettingsRow>
          <SettingsRow label={t('email.label')} value={profile.email ?? ''}>
            <EmailForm changeEmail={changeEmail} />
          </SettingsRow>
          <SettingsRow label={t('password.label')} value="••••••••">
            <PasswordForm changePassword={changePassword} />
          </SettingsRow>
        </Panel>
      </Section>

      <Section title={t('sections.preferences')}>
        <Panel>
          <LocaleSelect choose={chooseLocale} showLabel className="justify-between py-3.5" />
        </Panel>
        <p className="text-sm text-pretty text-muted-foreground">{language('hint')}</p>
      </Section>

      <Section title={t('sections.privacy')}>
        <Panel>
          <ConsentList
            consents={consents}
            timeZone={profile.timezone}
            setAiConsent={setAiConsent}
          />
          <JournalInsightsSwitch
            enabled={profile.journalInInsights}
            setJournalInInsights={setJournalInInsights}
          />
        </Panel>
        <p className="text-sm text-pretty text-muted-foreground">{t('consents.note')}</p>
      </Section>

      <Section title={t('sections.data')}>
        <Panel>
          <a href="/me/export" download className={rowLink}>
            {t('data.export')}
          </a>
          <DeleteAccount remove={deleteMyAccount} />
        </Panel>
      </Section>

      <SupportSection tickets={tickets} timeZone={profile.timezone} />

      <form action={signOut}>
        <Button type="submit" variant="outline">
          {t('signOut')}
        </Button>
      </form>
    </div>
  )
}
