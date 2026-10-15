import type {
  Assessment,
  CheckIn,
  CheckInQuery,
  PatientSummary,
  ProfessionalOverview,
} from '@mycogni/contracts'
import { attentionReasonsOf, dayKey, isSharingConsentCurrent, previousDays } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import { toAssessment } from '../assessments/assessment.service.ts'
import type { CheckInRepository } from '../check-ins/check-in.repository.ts'
import { toCheckIn } from '../check-ins/check-in.service.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import type { CareLinkRepository, PatientLinkRecord } from './care-link.repository.ts'
import type { PatientMetricsRepository, ScreeningRecord } from './patient-metrics.repository.ts'

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
  photos: BucketStore
  now: () => Date
}

const activityDays = 30

const recentLimit = 8

const dayInMilliseconds = 24 * 60 * 60 * 1000

function latestOf(screenings: ScreeningRecord[], instrument: ScreeningRecord['instrument']) {
  return screenings.find((screening) => screening.instrument === instrument) ?? null
}

export function createPatientService({
  careLinks,
  metrics,
  checkIns,
  assessments,
  professionals,
  photos,
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
    const ids = links.map((link) => link.patientId)
    const moment = now()
    const [lastCheckIns, stats, screenings, photoUrls] = await Promise.all([
      metrics.lastCheckIns(professionalId, ids),
      metrics.checkInStats(professionalId, ids, moment),
      metrics.latestScreenings(professionalId, ids),
      photos.sign(links.flatMap((link) => (link.avatarPath === null ? [] : [link.avatarPath]))),
    ])
    return links.map((link) => {
      const last = lastCheckIns.find((checkIn) => checkIn.patientId === link.patientId)
      const own = screenings.filter((screening) => screening.patientId === link.patientId)
      const patientStats = stats.get(link.patientId)
      const moodAverage = patientStats?.moodAverage ?? null
      const previousMoodAverage = patientStats?.previousMoodAverage ?? null
      return {
        id: link.patientId,
        linkId: link.linkId,
        name: link.name,
        photoUrl: link.avatarPath === null ? null : (photoUrls[link.avatarPath] ?? null),
        startedAt: link.startedAt.toISOString(),
        sharesHistory: link.sharesHistory,
        lastCheckIn:
          last === undefined
            ? null
            : { moodLevel: last.moodLevel, recordedAt: last.recordedAt.toISOString() },
        checkInsLastWeek: patientStats?.lastWeek ?? 0,
        checkInsLast30Days: patientStats?.lastMonth ?? 0,
        moodAverage,
        previousMoodAverage,
        screenings: own.map((screening) => ({
          instrument: screening.instrument,
          totalScore: screening.totalScore,
          severity: screening.severity,
          hasRiskFlag: screening.hasRiskFlag,
          completedAt: screening.completedAt.toISOString(),
        })),
        attention: attentionReasonsOf({
          latestPhq9: latestOf(own, 'phq9'),
          latestGad7: latestOf(own, 'gad7'),
          moodAverage,
          previousMoodAverage,
          lastCheckInAt: last?.recordedAt ?? null,
          linkedAt: link.startedAt,
          now: moment,
        }),
        termsOutdated: !isSharingConsentCurrent(link.consentVersion),
      }
    })
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
