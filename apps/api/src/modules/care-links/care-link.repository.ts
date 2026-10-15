import type { InstrumentId, Severity } from '@mycogni/domain'
import { and, count, desc, eq, gte, inArray, isNull } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  assessments,
  careLinks,
  checkIns,
  professionalProfiles,
  profiles,
} from '../../db/schema/index.ts'
import type { ProfessionalSummaryRecord } from '../invitations/invitation.repository.ts'

export interface CareLinkRecord {
  id: string
  professional: ProfessionalSummaryRecord
  sharesHistory: boolean
  startedAt: Date
}

export interface PatientLinkRecord {
  linkId: string
  patientId: string
  name: string | null
  sharesHistory: boolean
  startedAt: Date
}

export interface LastCheckInRecord {
  patientId: string
  moodLevel: number
  recordedAt: Date
}

export interface ScreeningRecord {
  patientId: string
  instrument: InstrumentId
  totalScore: number
  severity: Severity
  hasRiskFlag: boolean
  completedAt: Date
}

export interface CareLinkRepository {
  listForPatient(patientId: string): Promise<CareLinkRecord[]>
  findForPatient(patientId: string, linkId: string): Promise<CareLinkRecord | undefined>
  end(userId: string, linkId: string): Promise<boolean>
  listPatients(professionalId: string): Promise<PatientLinkRecord[]>
  lastCheckIns(professionalId: string, patientIds: string[]): Promise<LastCheckInRecord[]>
  checkInCounts(
    professionalId: string,
    patientIds: string[],
    since: Date,
  ): Promise<Map<string, number>>
  latestScreenings(professionalId: string, patientIds: string[]): Promise<ScreeningRecord[]>
}

const linkColumns = {
  id: careLinks.id,
  professional: {
    name: professionalProfiles.fullName,
    kind: professionalProfiles.kind,
    registration: professionalProfiles.registration,
  },
  sharesHistory: careLinks.sharesHistory,
  startedAt: careLinks.startedAt,
}

export function createCareLinkRepository(db: Database): CareLinkRepository {
  function activeLinksOf(patientId: string, linkId?: string) {
    return withUser(db, patientId, (tx) =>
      tx
        .select(linkColumns)
        .from(careLinks)
        .innerJoin(professionalProfiles, eq(professionalProfiles.userId, careLinks.professionalId))
        .where(
          and(
            eq(careLinks.patientId, patientId),
            isNull(careLinks.endedAt),
            linkId === undefined ? undefined : eq(careLinks.id, linkId),
          ),
        )
        .orderBy(desc(careLinks.startedAt)),
    )
  }

  return {
    listForPatient(patientId) {
      return activeLinksOf(patientId)
    },
    async findForPatient(patientId, linkId) {
      const [link] = await activeLinksOf(patientId, linkId)
      return link
    },
    end(userId, linkId) {
      return withUser(db, userId, async (tx) => {
        const [link] = await tx
          .select({ professionalId: careLinks.professionalId })
          .from(careLinks)
          .where(and(eq(careLinks.id, linkId), isNull(careLinks.endedAt)))
        if (link === undefined) {
          return false
        }
        const rows = await tx
          .update(careLinks)
          .set({
            endedAt: new Date(),
            endedBy: link.professionalId === userId ? 'professional' : 'patient',
          })
          .where(and(eq(careLinks.id, linkId), isNull(careLinks.endedAt)))
          .returning({ id: careLinks.id })
        return rows.length > 0
      })
    },
    listPatients(professionalId) {
      return withUser(db, professionalId, (tx) =>
        tx
          .select({
            linkId: careLinks.id,
            patientId: careLinks.patientId,
            name: profiles.displayName,
            sharesHistory: careLinks.sharesHistory,
            startedAt: careLinks.startedAt,
          })
          .from(careLinks)
          .innerJoin(profiles, eq(profiles.id, careLinks.patientId))
          .where(and(eq(careLinks.professionalId, professionalId), isNull(careLinks.endedAt)))
          .orderBy(profiles.displayName),
      )
    },
    lastCheckIns(professionalId, patientIds) {
      if (patientIds.length === 0) {
        return Promise.resolve([])
      }
      return withUser(db, professionalId, (tx) =>
        tx
          .selectDistinctOn([checkIns.userId], {
            patientId: checkIns.userId,
            moodLevel: checkIns.moodLevel,
            recordedAt: checkIns.recordedAt,
          })
          .from(checkIns)
          .where(inArray(checkIns.userId, patientIds))
          .orderBy(checkIns.userId, desc(checkIns.recordedAt)),
      )
    },
    async checkInCounts(professionalId, patientIds, since) {
      if (patientIds.length === 0) {
        return new Map()
      }
      const rows = await withUser(db, professionalId, (tx) =>
        tx
          .select({ patientId: checkIns.userId, total: count() })
          .from(checkIns)
          .where(and(inArray(checkIns.userId, patientIds), gte(checkIns.recordedAt, since)))
          .groupBy(checkIns.userId),
      )
      return new Map(rows.map((row) => [row.patientId, row.total]))
    },
    latestScreenings(professionalId, patientIds) {
      if (patientIds.length === 0) {
        return Promise.resolve([])
      }
      return withUser(db, professionalId, (tx) =>
        tx
          .selectDistinctOn([assessments.userId, assessments.instrument], {
            patientId: assessments.userId,
            instrument: assessments.instrument,
            totalScore: assessments.totalScore,
            severity: assessments.severity,
            hasRiskFlag: assessments.hasRiskFlag,
            completedAt: assessments.completedAt,
          })
          .from(assessments)
          .where(inArray(assessments.userId, patientIds))
          .orderBy(assessments.userId, assessments.instrument, desc(assessments.completedAt)),
      )
    },
  }
}
