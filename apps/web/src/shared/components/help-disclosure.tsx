import { useLocale, useTranslations } from 'next-intl'
import { crisisLinesFor } from '@/i18n/crisis-lines'
import { cn } from '@/shared/lib/utils'

const phoneLink = 'font-medium text-foreground underline decoration-1 underline-offset-4'

export function HelpDisclosure({ className }: { className?: string }) {
  const t = useTranslations('common.help')
  const lines = crisisLinesFor(useLocale())

  return (
    <details className={cn('text-sm', className)}>
      <summary className="w-fit cursor-pointer list-none text-help underline decoration-1 underline-offset-4 [&::-webkit-details-marker]:hidden">
        {t('summary')}
      </summary>
      <div className="mt-4 max-w-md space-y-2 border-l-2 border-help pl-4 leading-relaxed">
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
    </details>
  )
}
