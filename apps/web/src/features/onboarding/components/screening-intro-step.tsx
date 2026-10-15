import { useTranslations } from 'next-intl'
import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import { StepHeading } from '@/shared/components/step-heading'

const facts = [
  { figure: '16', key: 'questions' },
  { figure: '3', key: 'minutes' },
  { figure: '2', key: 'weeks' },
] as const

export function ScreeningIntroStep({ onStart }: { onStart: () => void }) {
  const t = useTranslations('onboarding.intro')

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <StepHeading title={t('title')}>
        {t.rich('lead', {
          nowrap: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
        })}
      </StepHeading>
      <dl className="mt-8 border-t border-rule">
        {facts.map((fact) => (
          <div key={fact.key} className="flex items-baseline gap-4 border-b border-rule py-3.5">
            <dt className="w-10 shrink-0 font-serif text-[30px] leading-none">{fact.figure}</dt>
            <dd className="text-[15px] text-muted-foreground">{t(`facts.${fact.key}`)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-[15px] leading-relaxed text-pretty">{t('honesty')}</p>
      <StepActions>
        <p className="mb-4 text-center text-sm text-muted-foreground">{t('disclaimer')}</p>
        <Button size="lg" shape="pill" onClick={onStart}>
          {t('start')}
        </Button>
      </StepActions>
    </section>
  )
}
