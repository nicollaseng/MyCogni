import type { ProfessionalProfile } from '@mycogni/contracts'
import { registrationProofOf } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import type { ActionResult } from '@/shared/lib/actions/result'
import { teamEmail } from '../contact'
import { formatDate } from '../dates'
import { onboardingSteps, stepNumberOf, type OnboardingStep } from '../onboarding'
import { DocumentStatus } from './document-status'
import { DocumentSummary } from './document-summary'
import { DocumentUpload } from './document-upload'
import { OnboardingSteps } from './onboarding-steps'
import { ProfilePhotoStep } from './profile-photo-step'
import { TeamNote } from './team-note'
import { Surface, WorkspaceHeader, WorkspaceSection } from './workspace'

const nextSteps = ['review', 'approve', 'invite'] as const

const inlineLink = 'text-foreground underline decoration-1 underline-offset-4'

export interface OnboardingActions {
  refresh: () => Promise<void>
  finishPhotoStep: () => Promise<ActionResult<null>>
}

interface OnboardingScreenProps {
  professional: ProfessionalProfile
  step: OnboardingStep
  timeZone: string
  photoUrl: string | null
  actions: OnboardingActions
}

function StepHeader({
  step,
  title,
  children,
}: {
  step: OnboardingStep
  title: string
  children: ReactNode
}) {
  const t = useTranslations('verification.steps')
  return (
    <WorkspaceHeader
      kicker={t('progress', { current: stepNumberOf(step), total: onboardingSteps.length })}
      title={title}
      description={children}
    />
  )
}

function DocumentStep({
  professional,
  actions,
}: Pick<OnboardingScreenProps, 'professional' | 'actions'>) {
  const t = useTranslations('verification.start')
  const rejected = useTranslations('professional.status.rejected')
  const upload = (
    <DocumentUpload proof={registrationProofOf(professional.kind)} onSent={actions.refresh} />
  )
  if (professional.status !== 'rejected') {
    return (
      <>
        <StepHeader step="document" title={t('title')}>
          {t('lead')}
        </StepHeader>
        {upload}
      </>
    )
  }
  return (
    <>
      <StepHeader step="document" title={rejected('title')}>
        {rejected.rich('body', {
          email: teamEmail,
          link: (chunks) => (
            <a href={`mailto:${teamEmail}`} className={inlineLink}>
              {chunks}
            </a>
          ),
        })}
      </StepHeader>
      <TeamNote note={professional.reviewNote} />
      {upload}
    </>
  )
}

function PhotoStep({
  professional,
  photoUrl,
  actions,
}: Omit<OnboardingScreenProps, 'step' | 'timeZone'>) {
  const t = useTranslations('verification.photo')
  const kinds = useTranslations('common.professionalKinds')
  return (
    <>
      <StepHeader step="photo" title={t('title')}>
        {t('lead')}
      </StepHeader>
      <p className="text-sm">
        <DocumentStatus state="pending" label={t('received')} />
      </p>
      <ProfilePhotoStep
        name={professional.fullName}
        profession={kinds(professional.kind)}
        photoUrl={photoUrl}
        onSaved={actions.refresh}
        finish={actions.finishPhotoStep}
      />
    </>
  )
}

function ReviewStep({
  professional,
  timeZone,
}: Pick<OnboardingScreenProps, 'professional' | 'timeZone'>) {
  const t = useTranslations('professional.status.pending')
  const document = useTranslations('verification.document')
  const review = useTranslations('verification.review')
  const locale = useLocale()
  return (
    <>
      <StepHeader step="review" title={t('title')}>
        {t('body')}
      </StepHeader>
      <WorkspaceSection title={document('title')}>
        <Surface className="px-5 py-4">
          <DocumentSummary professional={professional} timeZone={timeZone} />
        </Surface>
      </WorkspaceSection>
      <WorkspaceSection title={t('next')}>
        <Surface className="px-5 py-5">
          <ol className="space-y-3">
            {nextSteps.map((step, index) => (
              <li
                key={step}
                className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2 leading-relaxed"
              >
                <span aria-hidden className="text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span>{t(`steps.${step}`)}</span>
              </li>
            ))}
          </ol>
        </Surface>
        <p className="text-sm text-muted-foreground">
          {t('submitted', {
            date: formatDate(new Date(professional.createdAt), timeZone, locale),
          })}
        </p>
      </WorkspaceSection>
      <p className="text-sm text-muted-foreground">
        {review.rich('settings', {
          link: (chunks) => (
            <Link href="/pro/settings" className={inlineLink}>
              {chunks}
            </Link>
          ),
        })}
      </p>
    </>
  )
}

export function OnboardingScreen({
  professional,
  step,
  timeZone,
  photoUrl,
  actions,
}: OnboardingScreenProps) {
  return (
    <div className="lg:grid lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-16">
      <aside className="mb-9 lg:mb-0 lg:pt-2">
        <div className="lg:sticky lg:top-10">
          <OnboardingSteps current={step} kind={professional.kind} />
        </div>
      </aside>
      <div className="max-w-[37.5rem] min-w-0 space-y-8">
        {step === 'document' && <DocumentStep professional={professional} actions={actions} />}
        {step === 'photo' && (
          <PhotoStep professional={professional} photoUrl={photoUrl} actions={actions} />
        )}
        {step === 'review' && <ReviewStep professional={professional} timeZone={timeZone} />}
      </div>
    </div>
  )
}
