import type { ProfessionalKind, ProfessionalStatus } from '@mycogni/domain'
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
  registration: string | null
  email: string | null
  status: ProfessionalStatus
  reviewNote: string | null
  createdAt: Date
  verifiedAt: Date | null
  reviewedAt: Date | null
  document: ProfessionalDocumentRecord | null
}

export interface Review {
  status: ProfessionalStatus
  note: string | null
}

export type ReviewOutcome = 'reviewed' | 'not_found' | 'no_document'

export interface AdminRepository {
  isAdmin(userId: string): Promise<boolean>
  professionals(userId: string, status: ProfessionalStatus): Promise<ProfessionalForReviewRecord[]>
  documentPath(userId: string, documentId: string): Promise<string | undefined>
  review(userId: string, professionalId: string, review: Review): Promise<ReviewOutcome>
}

interface ReviewRow extends Record<string, unknown> {
  user_id: string
  kind: ProfessionalKind
  full_name: string
  registration: string | null
  email: string | null
  status: ProfessionalStatus
  review_note: string | null
  created_at: string
  verified_at: string | null
  reviewed_at: string | null
}

class MissingDocumentError extends Error {
  constructor() {
    super('Verification needs a registration document')
    this.name = 'MissingDocumentError'
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

export function createAdminRepository(db: Database): AdminRepository {
  return {
    isAdmin(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<{ admin: boolean }>(sql`select public.is_admin() as admin`)
        return Array.from(rows)[0]?.admin === true
      })
    },
    professionals(userId, status) {
      return withUser(db, userId, async (tx) => {
        const rows = Array.from(
          await tx.execute<ReviewRow>(
            sql`select * from public.professionals_for_review(${status})`,
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
          registration: row.registration,
          email: row.email,
          status: row.status,
          reviewNote: row.review_note,
          createdAt: new Date(row.created_at),
          verifiedAt: dateOf(row.verified_at),
          reviewedAt: dateOf(row.reviewed_at),
          document: documents.get(row.user_id) ?? null,
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
          if (status === 'verified' && (await latestDocuments(tx, [professionalId])).size === 0) {
            throw new MissingDocumentError()
          }
          return 'reviewed'
        })
      } catch (error) {
        if (error instanceof MissingDocumentError) {
          return 'no_document'
        }
        throw error
      }
    },
  }
}
