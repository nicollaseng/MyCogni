import { crisisLinesFor } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { StepActions } from '@/shared/components/step-actions'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'

export function SupportStep({ onContinue }: { onContinue: () => void }) {
  const t = useTranslations('screening.support')
  const lines = crisisLinesFor(useLocale())
  const [first] = lines

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mt-10 border-l-2 border-help pl-5">
        <h1 className="font-serif text-[34px] leading-[1.06] tracking-[-0.02em] text-balance">
          {t('title')}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-pretty">{t('body')}</p>
      </div>
      <dl className="mt-8 space-y-5 text-[15px] leading-relaxed">
        {lines.map((line) => (
          <div key={line.phone}>
            <dt className="font-medium">
              <a href={`tel:${line.phone}`} className="underline decoration-1 underline-offset-4">
                {line.display}
              </a>
            </dt>
            <dd className="text-muted-foreground">{line.description}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{t('danger')}</p>
      <StepActions className="gap-3">
        {first !== undefined && (
          <a href={`tel:${first.phone}`} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            {t('call')}
          </a>
        )}
        <Button size="lg" variant="outline" onClick={onContinue}>
          {t('continue')}
        </Button>
      </StepActions>
    </section>
  )
}
