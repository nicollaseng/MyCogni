import type { Metadata } from 'next'
import Link from 'next/link'
import { registrationProofOf } from '@mycogni/domain'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { changeEmail, changePassword, refreshAfterUpload } from '@/features/account/actions'
import { PhotoField } from '@/features/account/components/photo-field'
import { EmailForm } from '@/features/account/components/email-form'
import { PasswordForm } from '@/features/account/components/password-form'
import { SettingsRow } from '@/features/account/components/settings-row'
import { signOut } from '@/features/auth/actions'
import { chooseLocale } from '@/features/locale/actions'
import { LocaleSelect } from '@/features/locale/components/locale-select'
import { requireProfessional } from '@/features/professional/access'
import { renameProfessional } from '@/features/professional/actions'
import { DocumentReplace } from '@/features/professional/components/document-replace'
import { DocumentSummary } from '@/features/professional/components/document-summary'
import { DocumentUpload } from '@/features/professional/components/document-upload'
import { ProfessionalNameForm } from '@/features/professional/components/professional-name-form'
import { SignOutIcon } from '@/features/professional/components/icons'
import { TeamNote } from '@/features/professional/components/team-note'
import {
  compactButton,
  quietButton,
  Surface,
  WorkspaceHeader,
  WorkspaceSection,
} from '@/features/professional/components/workspace'
import { teamEmail } from '@/features/professional/contact'
import { formatDate } from '@/features/professional/dates'
import { TicketTable } from '@/features/support/components/ticket-table'
import { initialsOf } from '@/shared/lib/initials'
import { fetchSupportTickets } from '@/shared/lib/api/support'
import { requireProfile } from '@/shared/lib/auth/session'
import { fetchMyPhotoUrl } from '@/shared/lib/photos'

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
  const [
    professional,
    profile,
    photoUrl,
    tickets,
    t,
    account,
    common,
    verification,
    locale,
    support,
  ] = await Promise.all([
    requireProfessional(),
    requireProfile(),
    fetchMyPhotoUrl(),
    fetchSupportTickets(),
    getTranslations('professional.settings'),
    getTranslations('account'),
    getTranslations('common'),
    getTranslations('verification.document'),
    getLocale(),
    getTranslations('support.section'),
  ])
  const mailLink = (chunks: ReactNode) => (
    <a
      href={`mailto:${teamEmail}`}
      className="text-foreground underline decoration-1 underline-offset-4"
    >
      {chunks}
    </a>
  )
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
          <div className="py-4">
            <PhotoField
              photoUrl={photoUrl}
              initials={initialsOf(professional.fullName)}
              alt={common('photoOf', { name: professional.fullName })}
              size="lg"
              onSaved={refreshAfterUpload}
            >
              <p className="text-sm text-muted-foreground">{t('profile.photo')}</p>
              <p className="text-sm text-pretty">{t('profile.photoHint')}</p>
            </PhotoField>
          </div>
          <SettingsRow label={t('profile.name')} value={professional.fullName}>
            <ProfessionalNameForm initialName={professional.fullName} rename={renameProfessional} />
          </SettingsRow>
          <ReadOnlyRow
            label={t('profile.kind')}
            value={common(`professionalKinds.${professional.kind}`)}
          />
          <ReadOnlyRow
            label={t('profile.registration')}
            value={professional.registration ?? t('profile.noRegistration')}
          />
          <ReadOnlyRow label={t('profile.status')} value={statusText} />
        </Surface>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t.rich('profile.locked', { email: teamEmail, link: mailLink })}
        </p>
      </WorkspaceSection>
      <WorkspaceSection title={verification('title')}>
        <Surface className="max-w-3xl space-y-4 px-4 py-4 sm:px-5">
          <DocumentSummary professional={professional} timeZone={profile.timezone} />
          {professional.status === 'pending' && professional.document !== null && (
            <DocumentReplace
              proof={registrationProofOf(professional.kind)}
              onSent={refreshAfterUpload}
            />
          )}
        </Surface>
        {professional.status === 'rejected' && <TeamNote note={professional.reviewNote} />}
        {professional.status === 'verified' && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {verification.rich('locked', { email: teamEmail, link: mailLink })}
          </p>
        )}
        {professional.status !== 'verified' &&
          (professional.status === 'rejected' || professional.document === null) && (
            <Surface className="max-w-3xl px-4 py-5 sm:px-5">
              <DocumentUpload
                proof={registrationProofOf(professional.kind)}
                onSent={refreshAfterUpload}
              />
            </Surface>
          )}
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
      <div id="support" className="scroll-mt-8">
        <WorkspaceSection
          title={support('title')}
          description={support('description')}
          className="max-w-3xl"
          action={
            <Link href="/pro/support/new" className={compactButton}>
              {support('new')}
            </Link>
          }
        >
          <TicketTable tickets={tickets} timeZone={profile.timezone} />
        </WorkspaceSection>
      </div>
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
