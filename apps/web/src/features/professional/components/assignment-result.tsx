import type { AssignmentDetail } from '@mycogni/contracts'
import { catalogEntryOf, questionnaireForms, questionnaireText } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { formatDateTime, formatShortDate } from '../dates'
import { AlertIcon, BackIcon } from './icons'
import {
  BandsSection,
  ClustersSection,
  ItemsTable,
  ShadedSection,
  SourceSection,
} from './result-sections'
import { ResultTrend } from './result-trend'
import { Quiet, Surface, WorkspaceHeader, WorkspaceSection } from './workspace'

interface AssignmentResultProps {
  detail: AssignmentDetail
  patientName: string
  timeZone: string
}

function Notices({ complementary }: { complementary: boolean }) {
  const t = useTranslations('assignments.result')
  return (
    <div className="space-y-1.5 rounded-[8px] bg-surface px-4 py-3.5 text-[15px] leading-relaxed">
      <p className="font-medium text-pretty">{t('disclaimer')}</p>
      {complementary && (
        <p className="text-pretty">
          <span className="font-medium">{t('complementary')}.</span>{' '}
          <span className="text-muted-foreground">{t('complementaryHint')}</span>
        </p>
      )}
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  )
}

export function AssignmentResult({ detail, patientName, timeZone }: AssignmentResultProps) {
  const t = useTranslations('assignments')
  const locale = useLocale()
  const { assignment, response } = detail
  const entry = catalogEntryOf(assignment.variant)
  const name = assignment.variant === 'asrs6' ? t('names.asrs6') : entry.name
  const text = response === null ? null : questionnaireText(assignment.variant, response.locale)
  const date = (value: string) => formatShortDate(new Date(value), timeZone, locale)

  return (
    <>
      <WorkspaceHeader
        title={name}
        kicker={
          <Link
            href={`/pro/patients/${assignment.patientId}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <BackIcon className="size-4" />
            {patientName}
          </Link>
        }
        description={`${t(`areas.${entry.area}`)} · ${t(`statuses.${assignment.status}`)}`}
      />
      <Notices complementary={detail.complementarySource} />

      {response === null || text === null ? (
        <Quiet>
          {assignment.status === 'cancelled' || assignment.status === 'expired'
            ? t('result.closedNote')
            : t('result.pending')}
        </Quiet>
      ) : (
        <>
          {response.flags.map((flag) => (
            <p
              key={flag}
              role="note"
              className="flex items-start gap-2.5 rounded-[8px] bg-(--warn-soft) px-4 py-3.5 text-[15px] leading-relaxed text-pretty"
            >
              <AlertIcon className="mt-1 size-4 shrink-0 text-(--warn)" />
              {t(`result.flags.${flag}`)}
            </p>
          ))}

          <section aria-label={t('result.total')} className="grid gap-3 sm:grid-cols-3">
            <Surface className="space-y-1 px-4 py-3.5">
              <p className="text-sm text-muted-foreground">{t('result.total')}</p>
              <p className="font-serif text-[34px] leading-none tabular-nums">
                {response.score.total}
                <span className="text-[19px] text-muted-foreground">/{response.score.max}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t('result.range', { min: response.score.min, max: response.score.max })}
              </p>
            </Surface>
            <Surface className="space-y-1 px-4 py-3.5 sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t('result.band')}</p>
              <p className="font-serif text-[28px] leading-tight">
                {t(`bands.${response.score.band}`)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('result.answeredOn')} {date(response.completedAt)}
              </p>
            </Surface>
          </section>

          <WorkspaceSection title={t('result.bandsTitle')}>
            <Surface className="px-3 py-3 sm:px-4">
              <BandsSection variant={assignment.variant} score={response.score} />
            </Surface>
          </WorkspaceSection>

          {response.score.clusters.length > 0 && (
            <WorkspaceSection title={t('result.clustersTitle')}>
              <Surface className="px-3 py-3 sm:px-4">
                <ClustersSection score={response.score} />
              </Surface>
            </WorkspaceSection>
          )}

          {response.score.shaded !== null && (
            <WorkspaceSection title={t('result.shadedTitle')}>
              <Surface className="px-4 py-3.5">
                <ShadedSection score={response.score} />
              </Surface>
            </WorkspaceSection>
          )}

          <WorkspaceSection title={t('result.trendTitle')}>
            <Surface className="px-3 pt-3 pb-2 sm:px-5 sm:pt-4">
              <ResultTrend
                variant={assignment.variant}
                trend={detail.trend}
                current={assignment.id}
                timeZone={timeZone}
              />
            </Surface>
          </WorkspaceSection>

          <WorkspaceSection title={t('result.itemsTitle')}>
            <ItemsTable
              text={text}
              answers={response.answers}
              safetyItem={questionnaireForms[assignment.variant].safetyItem}
            />
          </WorkspaceSection>

          <WorkspaceSection title={t('result.details')}>
            <Surface className="px-4 py-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Fact label={t('result.answeredOn')}>
                  {formatDateTime(new Date(response.completedAt), timeZone, locale)}
                </Fact>
                <Fact label={t('result.consentedOn')}>
                  {formatDateTime(new Date(response.consentedAt), timeZone, locale)}
                </Fact>
                <Fact label={t('result.language')}>{response.locale}</Fact>
                <Fact label={t('result.version')}>{response.instrumentVersion}</Fact>
                {assignment.note !== null && (
                  <Fact label={t('result.note')}>{assignment.note}</Fact>
                )}
              </dl>
            </Surface>
          </WorkspaceSection>

          <WorkspaceSection title={t('result.attribution')}>
            <Surface className="px-4 py-4">
              <SourceSection text={text} />
            </Surface>
          </WorkspaceSection>
        </>
      )}
    </>
  )
}
