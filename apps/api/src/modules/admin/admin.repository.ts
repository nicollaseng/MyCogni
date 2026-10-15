import type { ProfessionalKind, ProfessionalStatus } from '@mycogni/domain'
import { sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'

export interface ProfessionalForReviewRecord {
  userId: string
  kind: ProfessionalKind
  fullName: string
  registration: string | null
  email: string | null
  status: ProfessionalStatus
  createdAt: Date
  verifiedAt: Date | null
}

export interface AdminRepository {
  isAdmin(userId: string): Promise<boolean>
  professionals(userId: string, status: ProfessionalStatus): Promise<ProfessionalForReviewRecord[]>
  review(userId: string, professionalId: string, status: ProfessionalStatus): Promise<boolean>
}

interface ReviewRow extends Record<string, unknown> {
  user_id: string
  kind: ProfessionalKind
  full_name: string
  registration: string | null
  email: string | null
  status: ProfessionalStatus
  created_at: string
  verified_at: string | null
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
        const rows = await tx.execute<ReviewRow>(
          sql`select * from public.professionals_for_review(${status})`,
        )
        return Array.from(rows).map((row) => ({
          userId: row.user_id,
          kind: row.kind,
          fullName: row.full_name,
          registration: row.registration,
          email: row.email,
          status: row.status,
          createdAt: new Date(row.created_at),
          verifiedAt: row.verified_at === null ? null : new Date(row.verified_at),
        }))
      })
    },
    review(userId, professionalId, status) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<{ reviewed: boolean }>(
          sql`select public.review_professional(${professionalId}, ${status}) as reviewed`,
        )
        return Array.from(rows)[0]?.reviewed === true
      })
    },
  }
}
