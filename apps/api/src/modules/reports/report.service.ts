import {
  patientInsightContentSchema,
  professionalInsightContentSchema,
  type MoodReportQuery,
} from '@mycogni/contracts'
import { defaultLocale, isLocale } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import type { CareLinkRepository } from '../care-links/care-link.repository.ts'
import type { CheckInRepository } from '../check-ins/check-in.repository.ts'
import type { InsightRecord, InsightRepository } from '../insights/insight.repository.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import type { ProfileRecord, ProfileRepository } from '../profile/profile.repository.ts'
import {
  buildReportModel,
  type ReportAudience,
  type ReportModel,
  type ReportReading,
} from './report-model.ts'

export interface ReportFile {
  fileName: string
  content: Buffer
}

export interface ReportService {
  mine(user: AuthenticatedUser, query: MoodReportQuery): Promise<ReportFile>
  ofPatient(user: AuthenticatedUser, patientId: string, query: MoodReportQuery): Promise<ReportFile>
}

export interface ReportDependencies {
  profiles: ProfileRepository
  checkIns: CheckInRepository
  assessments: AssessmentRepository
  insights: InsightRepository
  careLinks: CareLinkRepository
  professionals: ProfessionalRepository
  render: (model: ReportModel) => Promise<Buffer>
  now: () => Date
}

interface ReportSubject {
  audience: ReportAudience
  ownerId: string
  name: string | null
  readings: ReportReading[]
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

const checkInLimit = 1000

const readingLimit = 10

function patientReadings(records: readonly InsightRecord[]): ReportReading[] {
  return records.flatMap((record) => {
    const content = patientInsightContentSchema.safeParse(record.content)
    return content.success
      ? [{ ...record, audience: 'patient' as const, content: content.data }]
      : []
  })
}

function professionalReadings(records: readonly InsightRecord[]): ReportReading[] {
  return records.flatMap((record) => {
    const content = professionalInsightContentSchema.safeParse(record.content)
    return content.success
      ? [{ ...record, audience: 'professional' as const, content: content.data }]
      : []
  })
}

export function createReportService({
  profiles,
  checkIns,
  assessments,
  insights,
  careLinks,
  professionals,
  render,
  now,
}: ReportDependencies): ReportService {
  async function viewerProfile(userId: string): Promise<ProfileRecord> {
    const profile = await profiles.findById(userId)
    if (profile === undefined) {
      throw new NotFoundError('Profile not found')
    }
    return profile
  }

  async function report(
    viewer: ProfileRecord,
    subject: ReportSubject,
    query: MoodReportQuery,
  ): Promise<ReportFile> {
    const moment = now()
    const since = new Date(moment.getTime() - (query.days * 2 + 1) * dayInMilliseconds)
    const [records, screenings] = await Promise.all([
      checkIns.list(viewer.id, subject.ownerId, { since, limit: checkInLimit }),
      assessments.list(viewer.id, subject.ownerId),
    ])
    const model = buildReportModel({
      audience: subject.audience,
      locale: query.locale ?? (isLocale(viewer.locale) ? viewer.locale : defaultLocale),
      timeZone: viewer.timezone,
      now: moment,
      days: query.days,
      name: subject.name,
      checkIns: records,
      screenings,
      readings: subject.readings,
      includeNotes: query.notes,
    })
    return { fileName: model.fileName, content: await render(model) }
  }

  return {
    async mine(user, query) {
      const viewer = await viewerProfile(user.id)
      const readings = query.reading
        ? patientReadings(await insights.listForPatient(user.id, readingLimit))
        : []
      return report(
        viewer,
        { audience: 'patient', ownerId: user.id, name: viewer.displayName, readings },
        query,
      )
    },
    async ofPatient(user, patientId, query) {
      const professional = await professionals.find(user.id)
      if (professional?.status !== 'verified') {
        throw new ForbiddenError('Only verified professionals can download reports')
      }
      const link = (await careLinks.listPatients(user.id)).find(
        (candidate) => candidate.patientId === patientId,
      )
      if (link === undefined) {
        throw new NotFoundError('Patient not found')
      }
      const viewer = await viewerProfile(user.id)
      const readings = query.reading
        ? professionalReadings(await insights.listForProfessional(user.id, patientId, readingLimit))
        : []
      return report(
        viewer,
        { audience: 'professional', ownerId: patientId, name: link.name, readings },
        query,
      )
    },
  }
}
