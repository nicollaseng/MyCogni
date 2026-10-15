import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { changeEmail, changePassword } from '@/features/account/actions'
import { EmailForm } from '@/features/account/components/email-form'
import { PasswordForm } from '@/features/account/components/password-form'
import { SettingsRow } from '@/features/account/components/settings-row'
import { signOut } from '@/features/auth/actions'
import { chooseLocale } from '@/features/locale/actions'
import { LocaleSelect } from '@/features/locale/components/locale-select'
import { requireProfessional } from '@/features/professional/access'
import { renameProfessional } from '@/features/professional/actions'
import { ProfessionalNameForm } from '@/features/professional/components/professional-name-form'
import { SignOutIcon } from '@/features/professional/components/icons'
import {
  quietButton,
  Surface,
  WorkspaceHeader,
  WorkspaceSection,
} from '@/features/professional/components/workspace'
import { teamEmail } from '@/features/professional/contact'
import { formatDate } from '@/features/professional/dates'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('settings') }
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  )
}

export default async function ProfessionalSettingsPage() {
  const [professional, profile, t, account, kinds, locale] = await Promise.all([
    requireProfessional(),
    requireProfile(),
    getTranslations('professional.settings'),
    getTranslations('account'),
    getTranslations('common.professionalKinds'),
    getLocale(),
  ])
  const statusText =
    professional.status === 'verified' && professional.verifiedAt !== null
      ? t('profile.verified', {
          date: formatDate(new Date(professional.verifiedAt), profile.timezone, locale),
        })
      : professional.status === 'rejected'
        ? t('profile.rejected')
        : t('profile.pending', {
            date: formatDate(new Date(professional.createdAt), profile.timezone, locale),
          })

  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <WorkspaceSection title={t('profile.title')}>
        <Surface className="max-w-3xl px-4 py-1 sm:px-5">
          <SettingsRow label={t('profile.name')} value={professional.fullName}>
            <ProfessionalNameForm initialName={professional.fullName} rename={renameProfessional} />
          </SettingsRow>
          <ReadOnlyRow label={t('profile.kind')} value={kinds(professional.kind)} />
          <ReadOnlyRow
            label={t('profile.registration')}
            value={professional.registration ?? t('profile.noRegistration')}
          />
          <ReadOnlyRow label={t('profile.status')} value={statusText} />
        </Surface>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t.rich('profile.locked', {
            email: teamEmail,
            link: (chunks) => (
              <a
                href={`mailto:${teamEmail}`}
                className="text-foreground underline decoration-1 underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </WorkspaceSection>
      <WorkspaceSection title={t('account.title')}>
        <Surface className="max-w-3xl px-4 py-1 sm:px-5">
          <SettingsRow label={account('email.label')} value={profile.email ?? ''}>
            <EmailForm changeEmail={changeEmail} />
          </SettingsRow>
          <SettingsRow label={account('password.label')} value="••••••••">
            <PasswordForm changePassword={changePassword} />
          </SettingsRow>
          <LocaleSelect choose={chooseLocale} showLabel className="justify-between py-3.5" />
        </Surface>
      </WorkspaceSection>
      <WorkspaceSection title={t('session.title')} description={t('session.body')}>
        <form action={signOut}>
          <button type="submit" className={quietButton}>
            <SignOutIcon className="size-4" />
            {t('session.action')}
          </button>
        </form>
      </WorkspaceSection>
    </>
  )
}
