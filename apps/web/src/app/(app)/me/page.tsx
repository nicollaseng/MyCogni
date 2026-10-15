import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { signOut } from '@/features/auth/actions'
import {
  changeEmail,
  changePassword,
  deleteMyAccount,
  removeAvatar,
  renameMe,
  setAiConsent,
  uploadAvatar,
} from '@/features/account/actions'
import { avatarUrl } from '@/features/account/avatar-url'
import { endLink } from '@/features/care/actions'
import { CareLinks } from '@/features/care/components/care-links'
import { ConsentList } from '@/features/account/components/consent-list'
import { DeleteAccount } from '@/features/account/components/delete-account'
import { EmailForm } from '@/features/account/components/email-form'
import { NameForm } from '@/features/account/components/name-form'
import { PasswordForm } from '@/features/account/components/password-form'
import { ProfileHeader } from '@/features/account/components/profile-header'
import { SettingsRow } from '@/features/account/components/settings-row'
import { chooseLocale } from '@/features/locale/actions'
import { LocaleSelect } from '@/features/locale/components/locale-select'
import { LatestScreening } from '@/features/screening/components/latest-screening'
import { ScreeningHistory } from '@/features/screening/components/screening-history'
import { screeningIntervalDays } from '@/features/screening/due'
import { latestByInstrument } from '@/features/screening/latest'
import { Panel, Section } from '@/shared/components/section'
import { fetchCareLinks, fetchProfessional } from '@/shared/lib/api/care'
import { fetchAssessments, fetchConsents } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { Button } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('title') }
}

const rowLink = 'block py-3.5 underline decoration-1 underline-offset-4'

export default async function MePage() {
  const profile = await requireOnboardedProfile()
  const [assessments, consents, photoUrl, careLinks, professional, t, screening, language] =
    await Promise.all([
      fetchAssessments(),
      fetchConsents(),
      avatarUrl(profile.avatarPath),
      fetchCareLinks(),
      fetchProfessional(),
      getTranslations('account'),
      getTranslations('screening.latest'),
      getTranslations('common.language'),
    ])

  return (
    <div className="space-y-12">
      <ProfileHeader
        name={profile.displayName}
        email={profile.email}
        photoUrl={photoUrl}
        upload={uploadAvatar}
        remove={removeAvatar}
      />

      <LatestScreening results={latestByInstrument(assessments)} timeZone={profile.timezone}>
        <ScreeningHistory assessments={assessments} timeZone={profile.timezone} />
        <div className="space-y-1 px-1">
          <Link href="/questionnaires" className="underline decoration-1 underline-offset-4">
            {screening('retake')}
          </Link>
          <p className="text-sm text-muted-foreground">
            {screening('cadence', { days: screeningIntervalDays })}
          </p>
        </div>
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
        <p className="px-1 text-sm text-pretty text-muted-foreground">{language('hint')}</p>
      </Section>

      <Section title={t('sections.privacy')}>
        <Panel>
          <ConsentList
            consents={consents}
            timeZone={profile.timezone}
            setAiConsent={setAiConsent}
          />
        </Panel>
        <p className="px-1 text-sm text-pretty text-muted-foreground">{t('consents.note')}</p>
      </Section>

      <Section title={t('sections.data')}>
        <Panel>
          <a href="/me/export" download className={rowLink}>
            {t('data.export')}
          </a>
          <DeleteAccount remove={deleteMyAccount} />
        </Panel>
      </Section>

      <form action={signOut}>
        <Button type="submit" variant="outline" shape="pill">
          {t('signOut')}
        </Button>
      </form>
    </div>
  )
}
