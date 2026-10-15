import { maxMoodLevel, type WeekdayMood } from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { weekdayExtremes, weekdayLongName, weekdayName, weekOrder } from '../weekdays'

const rowGrid = 'grid grid-cols-[3rem_minmax(0,1fr)_2.5rem] items-center gap-x-3'

export function WeekdayChart({ weekdays }: { weekdays: readonly WeekdayMood[] }) {
  const t = useTranslations('patterns.weekdays')
  const mood = useTranslations('common.mood')
  const format = useFormatter()
  const locale = useLocale()
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const extremes = weekdayExtremes(weekdays)

  return (
    <Section title={t('title')}>
      <figure className="space-y-2">
        <ul className="space-y-2.5">
          {weekOrder(weekdays, locale).map((day) => {
            const name = weekdayName(day.weekday, locale)
            return (
              <li
                key={day.weekday}
                className={rowGrid}
                title={
                  day.average === null
                    ? `${name}: ${t('none')}`
                    : t('row', { weekday: name, average: decimal(day.average), count: day.days })
                }
              >
                <span className="text-sm">{name}</span>
                <span className="relative h-3 rounded-sm bg-foreground/[0.05]">
                  {day.average !== null && (
                    <span
                      data-weekday={day.weekday}
                      className="absolute inset-y-0 left-0 rounded-r-sm bg-emphasis"
                      style={{ width: `${String((day.average / maxMoodLevel) * 100)}%` }}
                    />
                  )}
                </span>
                <span className="text-right text-sm">
                  {day.average === null ? (
                    <span className="text-muted-foreground">–</span>
                  ) : (
                    decimal(day.average)
                  )}
                  <span className="sr-only">
                    {' '}
                    ({day.average === null ? t('none') : t('days', { count: day.days })})
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        <div aria-hidden className={`${rowGrid} text-[11px] text-muted-foreground`}>
          <span />
          <span className="flex justify-between">
            <span>{mood('veryBad')}</span>
            <span>{mood('neutral')}</span>
            <span>{mood('veryGood')}</span>
          </span>
          <span />
        </div>
        {extremes !== null && (
          <figcaption className="pt-1 text-sm text-pretty">
            {t('reading', {
              best: weekdayLongName(extremes.best, locale),
              worst: weekdayLongName(extremes.worst, locale),
            })}
          </figcaption>
        )}
      </figure>
    </Section>
  )
}
