import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { careLinks, professionalProfiles, profiles } from '../../db/schema/index.ts'
import type { ProfessionalSummaryRecord } from '../invitations/invitation.repository.ts'

export interface LinkedProfessionalRecord extends ProfessionalSummaryRecord {
  avatarPath: string | null
}

export interface CareLinkRecord {
  id: string
  professional: LinkedProfessionalRecord
  sharesHistory: boolean
  startedAt: Date
  consentVersion: string
}

export interface PatientLinkRecord {
  linkId: string
  patientId: string
  name: string | null
  avatarPath: string | null
  sharesHistory: boolean
  startedAt: Date
  consentVersion: string
}

export interface CareLinkRepository {
  listForPatient(patientId: string): Promise<CareLinkRecord[]>
  findForPatient(patientId: string, linkId: string): Promise<CareLinkRecord | undefined>
  end(userId: string, linkId: string): Promise<boolean>
  confirmTerms(patientId: string, linkId: string, version: string): Promise<boolean>
  listPatients(professionalId: string): Promise<PatientLinkRecord[]>
}

const linkColumns = {
  id: careLinks.id,
  professionalId: careLinks.professionalId,
  professional: {
    name: professionalProfiles.fullName,
    kind: professionalProfiles.kind,
    registration: professionalProfiles.registration,
  },
  sharesHistory: careLinks.sharesHistory,
  startedAt: careLinks.startedAt,
  consentVersion: careLinks.consentVersion,
}

export function createCareLinkRepository(db: Database): CareLinkRepository {
  function activeLinksOf(patientId: string, linkId?: string): Promise<CareLinkRecord[]> {
    return withUser(db, patientId, async (tx) => {
      const links = await tx
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
        .orderBy(desc(careLinks.startedAt))
      const avatars = await tx.execute<{ professional_id: string; avatar_path: string }>(
        sql`select * from public.linked_professional_avatars()`,
      )
      const avatarOf = new Map(
        Array.from(avatars).map((row) => [row.professional_id, row.avatar_path]),
      )
      return links.map(({ professionalId, professional, ...link }) => ({
        ...link,
        professional: { ...professional, avatarPath: avatarOf.get(professionalId) ?? null },
      }))
    })
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
    confirmTerms(patientId, linkId, version) {
      return withUser(db, patientId, async (tx) => {
        const rows = await tx.execute<{ confirmed: boolean }>(
          sql`select public.confirm_sharing_terms(${linkId}, ${version}) as confirmed`,
        )
        return Array.from(rows)[0]?.confirmed ?? false
      })
    },
    listPatients(professionalId) {
      return withUser(db, professionalId, (tx) =>
        tx
          .select({
            linkId: careLinks.id,
            patientId: careLinks.patientId,
            name: profiles.displayName,
            avatarPath: profiles.avatarPath,
            sharesHistory: careLinks.sharesHistory,
            startedAt: careLinks.startedAt,
            consentVersion: careLinks.consentVersion,
          })
          .from(careLinks)
          .innerJoin(profiles, eq(profiles.id, careLinks.patientId))
          .where(and(eq(careLinks.professionalId, professionalId), isNull(careLinks.endedAt)))
          .orderBy(profiles.displayName),
      )
    },
  }
}
