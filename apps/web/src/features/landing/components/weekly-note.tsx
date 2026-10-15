import { useTranslations } from 'next-intl'
import { moodColor, moodKeyOf, valenceOf } from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'
import { sampleWeek } from '../content'

const restfulSleep = 7

export function WeeklyNote() {
  const t = useTranslations('landing.weeklyNote')
  const mood = useTranslations('common.mood')

  return (
    <figure className="border-y border-rule py-8">
      <figcaption className="text-xs tracking-[0.04em] text-muted-foreground">
        {t('caption')}
      </figcaption>
      <blockquote className="mt-5 font-serif text-[21px] leading-[1.5] text-pretty sm:text-[23px]">
        {t('summary')}
      </blockquote>

      <table className="mt-8 w-full table-fixed text-center text-xs text-muted-foreground">
        <caption className="sr-only">{t('table')}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-14 text-left font-normal">
              <span className="sr-only">{t('measure')}</span>
            </th>
            {sampleWeek.map((entry) => (
              <th key={entry.day} scope="col" className="pb-2 font-normal">
                {t(`days.${entry.day}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="text-left font-normal">
              {t('mood')}
            </th>
            {sampleWeek.map((entry) => (
              <td
                key={entry.day}
                aria-label={mood(moodKeyOf(entry.mood))}
                className="h-16 align-bottom"
              >
                <span
                  className="mx-auto block w-5 rounded-[1px]"
                  style={{
                    height: `${String(28 + entry.mood * 12)}%`,
                    backgroundColor: moodColor(valenceOf(entry.mood)),
                  }}
                />
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="pt-3 text-left font-normal">
              {t('sleep')}
            </th>
            {sampleWeek.map((entry) => (
              <td
                key={entry.day}
                className={cn(
                  'pt-3',
                  entry.sleepHours < restfulSleep && 'font-medium text-foreground',
                )}
              >
                {t('hours', { hours: entry.sleepHours })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">{t('footnote')}</p>
    </figure>
  )
}
