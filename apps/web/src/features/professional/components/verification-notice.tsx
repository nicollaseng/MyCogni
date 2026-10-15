import type { ProfessionalProfile } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { teamEmail } from '../contact'
import { formatDate } from '../dates'
import { Surface, WorkspaceHeader } from './workspace'

const steps = ['review', 'approve', 'invite'] as const

interface VerificationNoticeProps {
  professional: ProfessionalProfile
  timeZone: string
}

function Pending({ professional, timeZone }: VerificationNoticeProps) {
  const t = useTranslations('professional.status.pending')
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
    </>
  )
}

function Rejected() {
  const t = useTranslations('professional.status.rejected')
  return (
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
  )
}

export function VerificationNotice({ professional, timeZone }: VerificationNoticeProps) {
  if (professional.status === 'rejected') {
    return <Rejected />
  }
  return <Pending professional={professional} timeZone={timeZone} />
}
