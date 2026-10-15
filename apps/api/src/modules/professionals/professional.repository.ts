import type { ProfessionalKind, ProfessionalStatus } from '@mycogni/domain'
import { eq } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { professionalProfiles } from '../../db/schema/index.ts'

export interface ProfessionalRecord {
  kind: ProfessionalKind
  fullName: string
  registration: string | null
  status: ProfessionalStatus
  createdAt: Date
  verifiedAt: Date | null
}

export interface NewProfessional {
  kind: ProfessionalKind
  fullName: string
  registration: string | null
}

export interface ProfessionalRepository {
  find(userId: string): Promise<ProfessionalRecord | undefined>
  create(userId: string, professional: NewProfessional): Promise<ProfessionalRecord | undefined>
}

const columns = {
  kind: professionalProfiles.kind,
  fullName: professionalProfiles.fullName,
  registration: professionalProfiles.registration,
  status: professionalProfiles.status,
  createdAt: professionalProfiles.createdAt,
  verifiedAt: professionalProfiles.verifiedAt,
}

export function createProfessionalRepository(db: Database): ProfessionalRepository {
  return {
    find(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select(columns)
          .from(professionalProfiles)
          .where(eq(professionalProfiles.userId, userId))
        return row
      })
    },
    create(userId, professional) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(professionalProfiles)
          .values({ ...professional, userId })
          .onConflictDoNothing()
          .returning(columns)
        return row
      })
    },
  }
}
