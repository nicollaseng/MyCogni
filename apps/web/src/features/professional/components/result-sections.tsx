import type { QuestionnaireScoreView } from '@mycogni/contracts'
import {
  questionnaireForms,
  scoreRange,
  scoreSourceReferences,
  type QuestionnaireText,
  type QuestionnaireVariant,
} from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { table, TableScroll } from './data-table'
import { AlertIcon } from './icons'

function bandRanges(variant: QuestionnaireVariant) {
  const { bands } = questionnaireForms[variant]
  const { max } = scoreRange(variant)
  return bands.map((band, index) => ({
    ...band,
    max: (bands[index + 1]?.min ?? max + 1) - 1,
  }))
}

export function SourceLink({ url, children }: { url: string; children: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="break-words underline decoration-1 underline-offset-4"
    >
      {children}
    </a>
  )
}

export function BandsSection({
  variant,
  score,
}: {
  variant: QuestionnaireVariant
  score: QuestionnaireScoreView
}) {
  const t = useTranslations('assignments')
  const form = questionnaireForms[variant]
  const sources = [...new Set(form.bands.map((band) => band.source))]

  return (
    <div className="space-y-3">
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {bandRanges(variant).map((band) => {
          const current = band.id === score.band
          return (
            <li
              key={band.id}
              aria-current={current ? 'true' : undefined}
              className={cn(
                'flex items-baseline justify-between gap-4 rounded-[6px] px-3 py-2 text-[15px]',
                current ? 'bg-background font-medium shadow-[0_0_0_1px_var(--rule)]' : '',
              )}
            >
              <span>{t(`bands.${band.id}`)}</span>
              <span className="text-muted-foreground tabular-nums">
                {band.min}–{band.max}
              </span>
            </li>
          )
        })}
      </ul>
      {!form.universalBands && (
        <p className="text-sm text-pretty text-(--warn)">{t('result.nonUniversal')}</p>
      )}
      {variant === 'pcl5' && (
        <p className="text-sm text-pretty text-muted-foreground">{t('result.otherReference')}</p>
      )}
      <div className="space-y-1 text-sm text-pretty text-muted-foreground">
        {sources.map((source) => (
          <p key={source}>
            <span className="text-foreground">{t('result.source')}: </span>
            <SourceLink url={scoreSourceReferences[source].url}>
              {scoreSourceReferences[source].citation}
            </SourceLink>
          </p>
        ))}
      </div>
    </div>
  )
}

export function ClustersSection({ score }: { score: QuestionnaireScoreView }) {
  const t = useTranslations('assignments')
  const rule = questionnaireForms.pcl5.clusters
  if (score.clusters.length === 0 || rule === null) {
    return null
  }
  return (
    <div className="space-y-3">
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {score.clusters.map((cluster) => {
          const count = rule.clusters.find((entry) => entry.id === cluster.id)?.items.length ?? 0
          return (
            <li key={cluster.id} className="space-y-0.5 px-1 py-1.5">
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{t(`clusters.${cluster.id}`)}</span>
                <span className="tabular-nums">
                  {cluster.total}/{cluster.max}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t('result.endorsed', {
                  endorsed: cluster.endorsed,
                  count,
                  required: cluster.required,
                })}
              </p>
            </li>
          )
        })}
      </ul>
      <p className="text-[15px] font-medium">
        {score.provisional === true ? t('result.provisional.met') : t('result.provisional.notMet')}
      </p>
      <p className="text-sm text-pretty text-muted-foreground">
        <span className="text-foreground">{t('result.source')}: </span>
        <SourceLink url={scoreSourceReferences[rule.source].url}>
          {scoreSourceReferences[rule.source].citation}
        </SourceLink>
      </p>
    </div>
  )
}

export function ShadedSection({ score }: { score: QuestionnaireScoreView }) {
  const t = useTranslations('assignments.result')
  const rule = questionnaireForms.asrs6.shaded
  if (score.shaded === null || rule === null) {
    return null
  }
  return (
    <div className="space-y-2">
      <p className="text-[15px]">
        {t('shaded', { count: score.shaded.count, positive: String(score.shaded.positive) })}
      </p>
      <p className="text-sm text-pretty text-muted-foreground">
        <span className="text-foreground">{t('source')}: </span>
        <SourceLink url={scoreSourceReferences[rule.source].url}>
          {scoreSourceReferences[rule.source].citation}
        </SourceLink>
      </p>
    </div>
  )
}

export function ItemsTable({
  text,
  answers,
  safetyItem,
}: {
  text: QuestionnaireText
  answers: readonly number[]
  safetyItem: number | null
}) {
  const t = useTranslations('assignments.result')
  const labelOf = (value: number) =>
    text.options.find((option) => option.value === value)?.label ?? String(value)

  return (
    <div className="space-y-2">
      <p className="text-sm text-pretty text-muted-foreground">{text.lead}</p>
      {text.stem !== null && <p className="text-sm text-muted-foreground">{text.stem}</p>}
      <TableScroll label={t('itemsTitle')}>
        <table className={cn(table.base, 'min-w-[640px]')}>
          <caption className="sr-only">{t('itemsTitle')}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn(table.head, table.headFirst, 'w-12')}>
                {t('item')}
              </th>
              <th scope="col" className={table.head}>
                <span className="sr-only">{t('item')}</span>
              </th>
              <th scope="col" className={table.head}>
                {t('answer')}
              </th>
              <th scope="col" className={cn(table.head, 'text-right')}>
                {t('value')}
              </th>
            </tr>
          </thead>
          <tbody>
            {text.items.map((item, index) => {
              const value = answers[index] ?? 0
              const flagged = index === safetyItem && value > 0
              return (
                <tr key={item} className={table.row}>
                  <td className={cn(table.cell, table.first, 'tabular-nums')}>{index + 1}</td>
                  <td className={cn(table.cell, 'text-pretty')}>{item}</td>
                  <td className={cn(table.cell, flagged && 'font-medium text-(--warn)')}>
                    <span className="inline-flex items-center gap-1.5">
                      {flagged && <AlertIcon className="size-3.5" />}
                      {labelOf(value)}
                    </span>
                  </td>
                  <td className={cn(table.cell, table.numeric)}>{value}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableScroll>
    </div>
  )
}

export function SourceSection({ text }: { text: QuestionnaireText }) {
  const t = useTranslations('assignments.result')
  return (
    <div className="space-y-4 text-sm leading-relaxed text-pretty">
      <div className="space-y-1">
        <p className="font-medium">{t('instructions')}</p>
        <p className="whitespace-pre-line text-muted-foreground">{text.instructions}</p>
      </div>
      <div className="space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">{t('attribution')}</p>
        <p>
          <SourceLink url={text.source.url}>{text.source.document}</SourceLink>
        </p>
        <p>{text.source.citation}</p>
        <p>{text.source.licence}</p>
        {text.notice !== null && <p className="text-foreground">{text.notice}</p>}
        {text.source.attribution !== null && text.source.attribution !== text.source.citation && (
          <p>{text.source.attribution}</p>
        )}
      </div>
    </div>
  )
}
