import { getTranslations } from 'next-intl/server'
import { changeEmail, refreshAfterUpload, renameMe } from '@/features/account/actions'
import { chooseLocale } from '@/features/locale/actions'
import { LocaleSelect } from '@/features/locale/components/locale-select'
import { Panel, Section } from '@/shared/components/section'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'
import { guarded } from '@/shared/lib/settled'
import { EmailForm } from './email-form'
import { NameForm } from './name-form'
import { ProfileHeader } from './profile-header'
import { SettingsPage } from './settings-page'
import { SettingsRow } from './settings-row'

export async function ProfileSettings() {
  const [profile, [photoUrl, t, language]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([
      fetchMyPhotoUrl(),
      getTranslations('account'),
      getTranslations('common.language'),
    ]),
  )

  return (
    <SettingsPage title={t('nav.profile')}>
      <ProfileHeader
        name={profile.displayName}
        email={profile.email}
        photoUrl={photoUrl}
        onPhotoSaved={refreshAfterUpload}
      />
      <Panel>
        <SettingsRow label={t('name.label')} value={profile.displayName ?? t('name.empty')}>
          <NameForm initialName={profile.displayName ?? ''} rename={renameMe} />
        </SettingsRow>
        <SettingsRow label={t('email.label')} value={profile.email ?? ''}>
          <EmailForm changeEmail={changeEmail} />
        </SettingsRow>
      </Panel>
      <Section title={t('sections.preferences')}>
        <Panel>
          <LocaleSelect choose={chooseLocale} showLabel className="justify-between py-3.5" />
        </Panel>
        <p className="text-sm text-pretty text-muted-foreground">{language('hint')}</p>
      </Section>
    </SettingsPage>
  )
}
