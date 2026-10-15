import type {
  Assessment,
  CheckIn,
  CheckInQuery,
  PatientSummary,
  ProfessionalOverview,
} from '@mycogni/contracts'
import { attentionReasonsOf, dayKey, previousDays } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import { toAssessment } from '../assessments/assessment.service.ts'
import type { CheckInRepository } from '../check-ins/check-in.repository.ts'
import { toCheckIn } from '../check-ins/check-in.service.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import type { CareLinkRepository, PatientLinkRecord } from './care-link.repository.ts'
import { loadPatientSignals } from './attention-signals.ts'
import type { PatientMetricsRepository } from './patient-metrics.repository.ts'

export interface PatientService {
  list(user: AuthenticatedUser): Promise<PatientSummary[]>
  find(user: AuthenticatedUser, patientId: string): Promise<PatientSummary>
  overview(user: AuthenticatedUser): Promise<ProfessionalOverview>
  checkIns(user: AuthenticatedUser, patientId: string, query: CheckInQuery): Promise<CheckIn[]>
  assessments(user: AuthenticatedUser, patientId: string): Promise<Assessment[]>
}

export interface PatientDependencies {
  careLinks: CareLinkRepository
  metrics: PatientMetricsRepository
  checkIns: CheckInRepository
  assessments: AssessmentRepository
  professionals: ProfessionalRepository
  now: () => Date
}

const activityDays = 30

const recentLimit = 8

const dayInMilliseconds = 24 * 60 * 60 * 1000

export function createPatientService({
  careLinks,
  metrics,
  checkIns,
  assessments,
  professionals,
  now,
}: PatientDependencies): PatientService {
  async function requireVerified(user: AuthenticatedUser): Promise<void> {
    const professional = await professionals.find(user.id)
    if (professional?.status !== 'verified') {
      throw new ForbiddenError('Only verified professionals can follow patients')
    }
  }

  async function summarize(
    professionalId: string,
    links: PatientLinkRecord[],
  ): Promise<PatientSummary[]> {
    const loaded = await loadPatientSignals(metrics, professionalId, links, now())
    return loaded.map(({ link, last, stats, screenings, signals }) => ({
      id: link.patientId,
      linkId: link.linkId,
      name: link.name,
      startedAt: link.startedAt.toISOString(),
      sharesHistory: link.sharesHistory,
      lastCheckIn:
        last === undefined
          ? null
          : { moodLevel: last.moodLevel, recordedAt: last.recordedAt.toISOString() },
      checkInsLastWeek: stats?.lastWeek ?? 0,
      checkInsLast30Days: stats?.lastMonth ?? 0,
      moodAverage: signals.moodAverage,
      previousMoodAverage: signals.previousMoodAverage,
      screenings: screenings.map((screening) => ({
        instrument: screening.instrument,
        totalScore: screening.totalScore,
        severity: screening.severity,
        hasRiskFlag: screening.hasRiskFlag,
        completedAt: screening.completedAt.toISOString(),
      })),
      attention: attentionReasonsOf(signals),
    }))
  }

  async function linkOrFail(
    user: AuthenticatedUser,
    patientId: string,
  ): Promise<PatientLinkRecord> {
    await requireVerified(user)
    const link = (await careLinks.listPatients(user.id)).find(
      (candidate) => candidate.patientId === patientId,
    )
    if (link === undefined) {
      throw new NotFoundError('Patient not found')
    }
    return link
  }

  return {
    async list(user) {
      await requireVerified(user)
      return summarize(user.id, await careLinks.listPatients(user.id))
    },
    async find(user, patientId) {
      const [summary] = await summarize(user.id, [await linkOrFail(user, patientId)])
      if (summary === undefined) {
        throw new NotFoundError('Patient not found')
      }
      return summary
    },
    async overview(user) {
      await requireVerified(user)
      const moment = now()
      const ids = (await careLinks.listPatients(user.id)).map((link) => link.patientId)
      const timeZone = await metrics.timeZoneOf(user.id)
      const days = previousDays(dayKey(moment, timeZone), activityDays)
      const since = new Date(moment.getTime() - (activityDays + 1) * dayInMilliseconds)
      const [activity, recent, invitations] = await Promise.all([
        metrics.activity(user.id, ids, since, timeZone),
        metrics.recentCheckIns(user.id, ids, recentLimit),
        metrics.invitationCounts(user.id),
      ])
      const byDay = new Map(activity.map((entry) => [entry.day, entry]))
      return {
        activity: days.map(
          (day) => byDay.get(day) ?? { day, checkIns: 0, patients: 0, moodAverage: null },
        ),
        recent: recent.map((entry) => ({ ...entry, recordedAt: entry.recordedAt.toISOString() })),
        invitations,
      }
    },
    async checkIns(user, patientId, query) {
      await linkOrFail(user, patientId)
      const records = await checkIns.list(user.id, patientId, {
        since: query.since === undefined ? undefined : new Date(query.since),
        before: query.before === undefined ? undefined : new Date(query.before),
        limit: query.limit,
      })
      return records.map(toCheckIn)
    },
    async assessments(user, patientId) {
      await linkOrFail(user, patientId)
      return (await assessments.list(user.id, patientId)).map(toAssessment)
    },
  }
}
