import { useTranslations } from 'next-intl'
import { MoodMap } from '@/features/mood/components/mood-map'
import { TodayActions } from './today-actions'

export function TodayIntro() {
  const t = useTranslations('today')

  return (
    <section className="flex items-center gap-6 sm:gap-10">
      <MoodMap valence={0.5} rings={9} className="size-32 shrink-0 sm:size-40" />
      <div className="space-y-4">
        <p className="leading-relaxed text-muted-foreground">{t('intro')}</p>
        <TodayActions />
      </div>
    </section>
  )
}
