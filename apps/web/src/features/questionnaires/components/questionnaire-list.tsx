import type { PatientQuestionnaires } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { formatLongDate } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

interface QuestionnaireListProps {
  questionnaires: PatientQuestionnaires
  timeZone: string
}

export function QuestionnaireList({ questionnaires, timeZone }: QuestionnaireListProps) {
  const t = useTranslations('questionnaires')
  const locale = useLocale()
  const { open, answered } = questionnaires

  return (
    <>
      <Section title={t('list.open')}>
        {open.length === 0 ? (
          <p className="text-muted-foreground">{t('list.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {open.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg bg-surface px-5 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-[17px] font-medium">{t(`areas.${assignment.area}`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.answered > 0
                      ? t('list.progress', {
                          answered: assignment.answered,
                          total: assignment.itemCount,
                        })
                      : t('size', { count: assignment.itemCount, minutes: assignment.minutes })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('list.from', { name: assignment.professional.name })}
                  </p>
                </div>
                <Link
                  href={`/questionnaires/${assignment.id}`}
                  className={cn(buttonVariants({ size: 'sm' }), 'px-5')}
                >
                  {assignment.status === 'in_progress' ? t('list.resume') : t('list.start')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title={t('list.answered')}>
        {answered.length === 0 ? (
          <p className="text-muted-foreground">{t('list.noneAnswered')}</p>
        ) : (
          <ul className="space-y-3">
            {answered.map((done) => (
              <li key={done.id} className="space-y-1 rounded-lg bg-surface px-5 py-4">
                <p className="text-sm text-muted-foreground">
                  {t('list.answeredOn', {
                    date: formatLongDate(new Date(done.completedAt), timeZone, locale),
                  })}
                </p>
                <p className="text-[17px]">
                  <span className="font-medium">{t(`names.${done.area}`)}</span>
                  {': '}
                  {done.summary.safety ? t('list.careful') : t(`levels.${done.summary.level}`)}
                </p>
                {!done.summary.safety && (
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    {t(`summary.sentences.${done.area}.${done.summary.level}`)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
