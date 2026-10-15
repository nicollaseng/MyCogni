import { useTranslations } from 'next-intl'
import { CrisisNumbers } from './crisis-numbers'

export function HelpPanel({ professionals }: { professionals: readonly string[] }) {
  const t = useTranslations('zen.help')

  return (
    <section aria-label={t('title')} className="space-y-1 border-l-2 border-help pl-4">
      <p className="leading-relaxed text-pretty">{t('attention')}</p>
      <CrisisNumbers />
      {professionals.map((name) => (
        <p key={name} className="text-sm text-muted-foreground">
          {t('professional', { name })}
        </p>
      ))}
    </section>
  )
}
