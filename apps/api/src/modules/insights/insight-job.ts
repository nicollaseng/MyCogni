import { dayKey, insightLookbackDays, isInsightDue, isLocale, type Locale } from '@mycogni/domain'
import type { InsightRecords, InsightWriter } from '../../ai/insight-writer.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import type { CheckInRecord, CheckInRepository } from '../check-ins/check-in.repository.ts'
import type { InsightRepository, JournalExcerpt } from './insight.repository.ts'

export type InsightOutcome =
  | { kind: 'skipped'; reason: 'no_profile' | 'no_consent' | 'not_due' | 'declined' }
  | { kind: 'written'; patientInsightId: string; professionalInsights: number }

export interface InsightJob {
  run(patientId: string): Promise<InsightOutcome>
}

export interface InsightJobDependencies {
  insights: InsightRepository
  checkIns: CheckInRepository
  assessments: AssessmentRepository
  writer: InsightWriter
  alerts: Pick<JobScheduler, 'summaryCreated'>
  now: () => Date
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

const journalLimit = 10

const journalTextLimit = 3000

const checkInLimit = 200

const fallbackLocale: Locale = 'pt-BR'

export function createInsightJob({
  insights,
  checkIns,
  assessments,
  writer,
  alerts,
  now,
}: InsightJobDependencies): InsightJob {
  function toRecords(
    locale: Locale,
    timeZone: string,
    period: { start: Date; end: Date },
    records: CheckInRecord[],
    screenings: Awaited<ReturnType<AssessmentRepository['list']>>,
    journal: JournalExcerpt[],
  ): InsightRecords {
    return {
      locale,
      period: { start: dayKey(period.start, timeZone), end: dayKey(period.end, timeZone) },
      checkIns: [...records].reverse().map((record) => ({
        day: dayKey(record.recordedAt, timeZone),
        moodLevel: record.moodLevel,
        emotions: record.emotions,
        contexts: record.contexts,
        note: record.note,
      })),
      screenings: screenings
        .filter(
          (screening) =>
            screening.completedAt.getTime() >= period.start.getTime() - 14 * dayInMilliseconds,
        )
        .map((screening) => ({
          instrument: screening.instrument,
          totalScore: screening.totalScore,
          severity: screening.severity,
          day: dayKey(screening.completedAt, timeZone),
        })),
      journal: journal.map((entry) => ({
        day: dayKey(entry.updatedAt, timeZone),
        title: entry.title,
        text: entry.plainText.slice(0, journalTextLimit),
      })),
    }
  }

  return {
    async run(patientId) {
      const subject = await insights.subject(patientId)
      if (subject === undefined) {
        return { kind: 'skipped', reason: 'no_profile' }
      }
      if (!subject.aiConsent) {
        return { kind: 'skipped', reason: 'no_consent' }
      }
      const floor = new Date(now().getTime() - insightLookbackDays * dayInMilliseconds)
      const lastEnd = await insights.lastPatientInsightEnd(patientId)
      const start = lastEnd === null || lastEnd < floor ? floor : new Date(lastEnd.getTime() + 1)
      const own = await checkIns.list(patientId, patientId, { since: start, limit: checkInLimit })
      const latest = own[0]
      if (latest === undefined || !isInsightDue(own.length)) {
        return { kind: 'skipped', reason: 'not_due' }
      }
      const end = latest.recordedAt
      const window = { since: start, before: new Date(end.getTime() + 1), limit: checkInLimit }
      const locale = isLocale(subject.locale) ? subject.locale : fallbackLocale
      const period = { start, end }
      const [screenings, journal] = await Promise.all([
        assessments.list(patientId, patientId),
        subject.journalInInsights
          ? insights.journal(patientId, start, journalLimit)
          : Promise.resolve([]),
      ])
      const content = await writer.forPatient(
        toRecords(locale, subject.timezone, period, own, screenings, journal),
      )
      if (content === null) {
        return { kind: 'skipped', reason: 'declined' }
      }
      const patientInsightId = await insights.save({
        patientId,
        audience: 'patient',
        professionalId: null,
        periodStart: start,
        periodEnd: end,
        checkInCount: own.length,
        content,
        model: writer.model,
      })
      let professionalInsights = 0
      for (const link of await insights.linkedProfessionals(patientId)) {
        const visible = await checkIns.list(link.professionalId, patientId, window)
        if (visible.length === 0) {
          continue
        }
        const theirScreenings = await assessments.list(link.professionalId, patientId)
        const professionalLocale = isLocale(link.locale) ? link.locale : locale
        const written = await writer.forProfessional(
          toRecords(professionalLocale, subject.timezone, period, visible, theirScreenings, []),
        )
        if (written !== null) {
          const insightId = await insights.save({
            patientId,
            audience: 'professional',
            professionalId: link.professionalId,
            periodStart: start,
            periodEnd: end,
            checkInCount: visible.length,
            content: written,
            model: writer.model,
          })
          await alerts.summaryCreated(insightId)
          professionalInsights += 1
        }
      }
      return { kind: 'written', patientInsightId, professionalInsights }
    },
  }
}
