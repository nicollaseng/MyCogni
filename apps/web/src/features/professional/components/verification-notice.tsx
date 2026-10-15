import type { ProfessionalProfile } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import { Panel } from '@/shared/components/section'
import { teamEmail } from '../contact'
import { formatDate } from '../dates'

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
      <PageTitle title={t('title')} description={t('body')} />
      <section aria-labelledby="verification-next" className="max-w-2xl space-y-3">
        <h2 id="verification-next" className="px-1 text-sm text-muted-foreground">
          {t('next')}
        </h2>
        <Panel className="py-5">
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-sage text-sm font-medium"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{t(`steps.${step}`)}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <p className="px-1 text-sm text-muted-foreground">
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
    <header className="space-y-3">
      <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl">
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
