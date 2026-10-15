import { useLocale, useTranslations } from 'next-intl'
import { crisisLinesFor } from '@/i18n/crisis-lines'
import { Disclosure } from './disclosure'

const phoneLink = 'font-medium text-foreground underline decoration-1 underline-offset-4'

export function HelpDisclosure({ className }: { className?: string }) {
  const t = useTranslations('common.help')
  const lines = crisisLinesFor(useLocale())

  return (
    <Disclosure
      className={className}
      buttonClassName="text-sm text-help"
      panelClassName="pt-4"
      summary={<span className="underline decoration-1 underline-offset-4">{t('summary')}</span>}
    >
      <div className="max-w-md space-y-2 border-l-2 border-help pl-4 text-sm leading-relaxed">
        <p>{t('intro')}</p>
        {lines.map((line) => (
          <p key={line.phone}>
            <a href={`tel:${line.phone}`} className={phoneLink}>
              {line.display}
            </a>{' '}
            <span className="text-muted-foreground">{line.description}</span>
          </p>
        ))}
        <p className="pt-2 text-muted-foreground">{t('disclaimer')}</p>
      </div>
    </Disclosure>
  )
}
