import type { Assessment, CheckIn, CheckInQuery, PatientSummary } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import { toAssessment } from '../assessments/assessment.service.ts'
import type { CheckInRepository } from '../check-ins/check-in.repository.ts'
import { toCheckIn } from '../check-ins/check-in.service.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import type { CareLinkRepository, PatientLinkRecord } from './care-link.repository.ts'

export interface PatientService {
  list(user: AuthenticatedUser): Promise<PatientSummary[]>
  find(user: AuthenticatedUser, patientId: string): Promise<PatientSummary>
  checkIns(user: AuthenticatedUser, patientId: string, query: CheckInQuery): Promise<CheckIn[]>
  assessments(user: AuthenticatedUser, patientId: string): Promise<Assessment[]>
}

export interface PatientDependencies {
  careLinks: CareLinkRepository
  checkIns: CheckInRepository
  assessments: AssessmentRepository
  professionals: ProfessionalRepository
  now: () => Date
}

const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000

export function createPatientService({
  careLinks,
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
    const ids = links.map((link) => link.patientId)
    const [lastCheckIns, counts, screenings] = await Promise.all([
      careLinks.lastCheckIns(professionalId, ids),
      careLinks.checkInCounts(professionalId, ids, new Date(now().getTime() - weekInMilliseconds)),
      careLinks.latestScreenings(professionalId, ids),
    ])
    return links.map((link) => {
      const last = lastCheckIns.find((checkIn) => checkIn.patientId === link.patientId)
      return {
        id: link.patientId,
        linkId: link.linkId,
        name: link.name,
        startedAt: link.startedAt.toISOString(),
        sharesHistory: link.sharesHistory,
        lastCheckIn:
          last === undefined
            ? null
            : { moodLevel: last.moodLevel, recordedAt: last.recordedAt.toISOString() },
        checkInsLastWeek: counts.get(link.patientId) ?? 0,
        screenings: screenings
          .filter((screening) => screening.patientId === link.patientId)
          .map((screening) => ({
            instrument: screening.instrument,
            totalScore: screening.totalScore,
            severity: screening.severity,
            hasRiskFlag: screening.hasRiskFlag,
            completedAt: screening.completedAt.toISOString(),
          })),
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
