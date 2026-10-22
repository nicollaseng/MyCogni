import type {
  ProfessionalCouncil,
  ProfessionalKind,
  ProfessionalStatus,
  ReviewDecision,
  StoredRegistration,
} from '@mycogni/domain'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { professionalDocuments } from '../../db/schema/index.ts'
import {
  documentColumns,
  type ProfessionalDocumentRecord,
} from '../professionals/professional.repository.ts'

export interface ProfessionalForReviewRecord {
  userId: string
  kind: ProfessionalKind
  fullName: string
  registration: StoredRegistration
  email: string | null
  status: ProfessionalStatus
  reviewNote: string | null
  createdAt: Date
  verifiedAt: Date | null
  reviewedAt: Date | null
  avatarPath: string | null
  locale: string | null
  activeLinks: number
  pendingInvitations: number
  document: ProfessionalDocumentRecord | null
}

export interface ReviewEntryRecord {
  id: string
  decision: ReviewDecision
  note: string | null
  adminEmail: string | null
  createdAt: Date
}

export interface Review {
  status: ReviewDecision
  note: string | null
}

export type ReviewOutcome = 'reviewed' | 'not_found' | 'no_document' | 'no_photo'

export interface AdminRepository {
  isAdmin(userId: string): Promise<boolean>
  professionals(userId: string, status: ProfessionalStatus): Promise<ProfessionalForReviewRecord[]>
  professional(
    userId: string,
    professionalId: string,
  ): Promise<ProfessionalForReviewRecord | undefined>
  history(userId: string, professionalId: string): Promise<ReviewEntryRecord[]>
  documentPath(userId: string, documentId: string): Promise<string | undefined>
  review(userId: string, professionalId: string, review: Review): Promise<ReviewOutcome>
}

interface ReviewRow extends Record<string, unknown> {
  user_id: string
  kind: ProfessionalKind
  full_name: string
  registration: string | null
  registration_council: ProfessionalCouncil | null
  registration_uf: string | null
  registration_number: string | null
  email: string | null
  status: ProfessionalStatus
  review_note: string | null
  created_at: string
  verified_at: string | null
  reviewed_at: string | null
  avatar_path: string | null
  locale: string | null
  active_links: number
  pending_invitations: number
}

interface HistoryRow extends Record<string, unknown> {
  id: string
  decision: ReviewDecision
  note: string | null
  admin_email: string | null
  created_at: string
}

class IncompleteReviewError extends Error {
  readonly outcome: ReviewOutcome

  constructor(outcome: ReviewOutcome) {
    super(`Verification needs a document and a photo: ${outcome}`)
    this.name = 'IncompleteReviewError'
    this.outcome = outcome
  }
}

function dateOf(value: string | null): Date | null {
  return value === null ? null : new Date(value)
}

async function latestDocuments(
  tx: Transaction,
  professionalIds: string[],
): Promise<Map<string, ProfessionalDocumentRecord>> {
  if (professionalIds.length === 0) {
    return new Map()
  }
  const rows = await tx
    .selectDistinctOn([professionalDocuments.userId], {
      userId: professionalDocuments.userId,
      ...documentColumns,
    })
    .from(professionalDocuments)
    .where(inArray(professionalDocuments.userId, professionalIds))
    .orderBy(professionalDocuments.userId, desc(professionalDocuments.createdAt))
  return new Map(rows.map(({ userId, ...document }) => [userId, document]))
}

async function reviewRows(
  tx: Transaction,
  status: ProfessionalStatus | null,
  professionalId: string | null,
): Promise<ProfessionalForReviewRecord[]> {
  const rows = Array.from(
    await tx.execute<ReviewRow>(
      sql`select * from public.professionals_for_review(${status}, ${professionalId})`,
    ),
  )
  const documents = await latestDocuments(
    tx,
    rows.map((row) => row.user_id),
  )
  return rows.map((row) => ({
    userId: row.user_id,
    kind: row.kind,
    fullName: row.full_name,
    registration: {
      council: row.registration_council,
      uf: row.registration_uf,
      number: row.registration_number,
      text: row.registration,
    },
    email: row.email,
    status: row.status,
    reviewNote: row.review_note,
    createdAt: new Date(row.created_at),
    verifiedAt: dateOf(row.verified_at),
    reviewedAt: dateOf(row.reviewed_at),
    avatarPath: row.avatar_path,
    locale: row.locale,
    activeLinks: row.active_links,
    pendingInvitations: row.pending_invitations,
    document: documents.get(row.user_id) ?? null,
  }))
}

export function createAdminRepository(db: Database): AdminRepository {
  return {
    isAdmin(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<{ admin: boolean }>(sql`select public.is_admin() as admin`)
        return Array.from(rows)[0]?.admin === true
      })
    },
    professionals(userId, status) {
      return withUser(db, userId, (tx) => reviewRows(tx, status, null))
    },
    professional(userId, professionalId) {
      return withUser(db, userId, async (tx) => {
        const [record] = await reviewRows(tx, null, professionalId)
        return record
      })
    },
    history(userId, professionalId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<HistoryRow>(
          sql`select * from public.professional_review_history(${professionalId})`,
        )
        return Array.from(rows).map((row) => ({
          id: row.id,
          decision: row.decision,
          note: row.note,
          adminEmail: row.admin_email,
          createdAt: new Date(row.created_at),
        }))
      })
    },
    documentPath(userId, documentId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({ path: professionalDocuments.path })
          .from(professionalDocuments)
          .where(eq(professionalDocuments.id, documentId))
        return row?.path
      })
    },
    async review(userId, professionalId, { status, note }) {
      try {
        return await withUser(db, userId, async (tx) => {
          const rows = await tx.execute<{ reviewed: boolean }>(
            sql`select public.review_professional(${professionalId}, ${status}, ${note}) as reviewed`,
          )
          if (Array.from(rows)[0]?.reviewed !== true) {
            return 'not_found'
          }
          if (status === 'verified') {
            const [record] = await reviewRows(tx, null, professionalId)
            if (record?.document === null) {
              throw new IncompleteReviewError('no_document')
            }
            if (record?.avatarPath === null) {
              throw new IncompleteReviewError('no_photo')
            }
          }
          return 'reviewed'
        })
      } catch (error) {
        if (error instanceof IncompleteReviewError) {
          return error.outcome
        }
        throw error
      }
    },
  }
}
