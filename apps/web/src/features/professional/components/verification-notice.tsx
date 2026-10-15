import type { ProfessionalProfile } from '@mycogni/contracts'
import { registrationProofOf } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { refreshAfterUpload } from '@/features/account/actions'
import { PhotoField } from '@/features/account/components/photo-field'
import { teamEmail } from '../contact'
import { formatDate } from '../dates'
import { initialsOf } from '../initials'
import { DocumentSummary } from './document-summary'
import { DocumentUpload } from './document-upload'
import { TeamNote } from './team-note'
import { Surface, WorkspaceHeader, WorkspaceSection } from './workspace'

const steps = ['review', 'approve', 'invite'] as const

interface VerificationNoticeProps {
  professional: ProfessionalProfile
  timeZone: string
  photoUrl: string | null
}

function DocumentRequest({ professional, photoUrl }: Omit<VerificationNoticeProps, 'timeZone'>) {
  const t = useTranslations('verification.start')
  const common = useTranslations('common')
  return (
    <>
      <WorkspaceHeader kicker={t('kicker')} title={t('title')} description={t('lead')} />
      <Surface className="max-w-2xl px-5 py-5 sm:px-6">
        <DocumentUpload
          proof={registrationProofOf(professional.kind)}
          onSent={refreshAfterUpload}
        />
      </Surface>
      <WorkspaceSection title={t('photo')} description={t('photoHint')} className="max-w-2xl">
        <PhotoField
          photoUrl={photoUrl}
          initials={initialsOf(professional.fullName)}
          alt={common('photoOf', { name: professional.fullName })}
          size="lg"
          onSaved={refreshAfterUpload}
        />
      </WorkspaceSection>
    </>
  )
}

function Pending({ professional, timeZone }: Omit<VerificationNoticeProps, 'photoUrl'>) {
  const t = useTranslations('professional.status.pending')
  const document = useTranslations('verification.document')
  const locale = useLocale()
  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('body')} />
      <section aria-labelledby="verification-next" className="max-w-2xl space-y-3">
        <h2 id="verification-next" className="font-serif text-[21px] leading-tight">
          {t('next')}
        </h2>
        <Surface className="px-5 py-5">
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-sm font-medium"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{t(`steps.${step}`)}</span>
              </li>
            ))}
          </ol>
        </Surface>
        <p className="text-sm text-muted-foreground">
          {t('submitted', {
            date: formatDate(new Date(professional.createdAt), timeZone, locale),
          })}
        </p>
      </section>
      <WorkspaceSection title={document('title')} className="max-w-2xl">
        <Surface className="px-5 py-4">
          <DocumentSummary professional={professional} timeZone={timeZone} />
        </Surface>
      </WorkspaceSection>
    </>
  )
}

function Rejected({ professional }: Pick<VerificationNoticeProps, 'professional'>) {
  const t = useTranslations('professional.status.rejected')
  return (
    <>
      <header className="space-y-2">
        <h1 className="font-serif text-[28px] leading-[1.1] tracking-[-0.015em] sm:text-[34px]">
          {t('title')}
        </h1>
        <p className="max-w-[36rem] leading-relaxed text-muted-foreground">
          {t.rich('body', {
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
      </header>
      <TeamNote note={professional.reviewNote} />
      <Surface className="max-w-2xl px-5 py-5 sm:px-6">
        <DocumentUpload
          proof={registrationProofOf(professional.kind)}
          onSent={refreshAfterUpload}
        />
      </Surface>
    </>
  )
}

export function VerificationNotice({ professional, timeZone, photoUrl }: VerificationNoticeProps) {
  if (professional.status === 'rejected') {
    return <Rejected professional={professional} />
  }
  if (professional.document === null) {
    return <DocumentRequest professional={professional} photoUrl={photoUrl} />
  }
  return <Pending professional={professional} timeZone={timeZone} />
}
