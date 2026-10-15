import type {
  ProfessionalDocumentType,
  ProfessionalKind,
  ProfessionalStatus,
} from '@mycogni/domain'
import { desc, eq, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { professionalDocuments, professionalProfiles } from '../../db/schema/index.ts'

export interface ProfessionalDocumentRecord {
  id: string
  fileName: string
  contentType: ProfessionalDocumentType
  sizeBytes: number
  createdAt: Date
}

export interface ProfessionalRecord {
  kind: ProfessionalKind
  fullName: string
  registration: string | null
  status: ProfessionalStatus
  reviewNote: string | null
  createdAt: Date
  verifiedAt: Date | null
  reviewedAt: Date | null
  document: ProfessionalDocumentRecord | null
}

export interface NewProfessional {
  kind: ProfessionalKind
  fullName: string
  registration: string | null
}

export interface NewProfessionalDocument {
  path: string
  fileName: string
  contentType: ProfessionalDocumentType
  sizeBytes: number
}

export class DocumentNotStoredError extends Error {
  constructor() {
    super('The document is not in the folder of this professional')
    this.name = 'DocumentNotStoredError'
  }
}

export interface ProfessionalRepository {
  find(userId: string): Promise<ProfessionalRecord | undefined>
  create(userId: string, professional: NewProfessional): Promise<ProfessionalRecord | undefined>
  rename(userId: string, fullName: string): Promise<ProfessionalRecord | undefined>
  submitDocument(
    userId: string,
    document: NewProfessionalDocument,
  ): Promise<ProfessionalRecord | undefined>
}

const columns = {
  kind: professionalProfiles.kind,
  fullName: professionalProfiles.fullName,
  registration: professionalProfiles.registration,
  status: professionalProfiles.status,
  reviewNote: professionalProfiles.reviewNote,
  createdAt: professionalProfiles.createdAt,
  verifiedAt: professionalProfiles.verifiedAt,
  reviewedAt: professionalProfiles.reviewedAt,
}

export const documentColumns = {
  id: professionalDocuments.id,
  fileName: professionalDocuments.fileName,
  contentType: professionalDocuments.contentType,
  sizeBytes: professionalDocuments.sizeBytes,
  createdAt: professionalDocuments.createdAt,
}

function isPolicyViolation(error: unknown): boolean {
  const cause: unknown = error instanceof Error ? error.cause : undefined
  return typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '42501'
}

async function withLatestDocument(
  tx: Transaction,
  userId: string,
  profile: Omit<ProfessionalRecord, 'document'> | undefined,
): Promise<ProfessionalRecord | undefined> {
  if (profile === undefined) {
    return undefined
  }
  const [document] = await tx
    .select(documentColumns)
    .from(professionalDocuments)
    .where(eq(professionalDocuments.userId, userId))
    .orderBy(desc(professionalDocuments.createdAt))
    .limit(1)
  return { ...profile, document: document ?? null }
}

export function createProfessionalRepository(db: Database): ProfessionalRepository {
  function current(tx: Transaction, userId: string) {
    return tx
      .select(columns)
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
  }

  return {
    find(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await current(tx, userId)
        return withLatestDocument(tx, userId, row)
      })
    },
    create(userId, professional) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(professionalProfiles)
          .values({ ...professional, userId })
          .onConflictDoNothing()
          .returning(columns)
        return withLatestDocument(tx, userId, row)
      })
    },
    rename(userId, fullName) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .update(professionalProfiles)
          .set({ fullName })
          .where(eq(professionalProfiles.userId, userId))
          .returning(columns)
        return withLatestDocument(tx, userId, row)
      })
    },
    async submitDocument(userId, document) {
      try {
        return await withUser(db, userId, async (tx) => {
          await tx.insert(professionalDocuments).values({ ...document, userId })
          await tx.execute(sql`select public.reopen_professional_review()`)
          const [row] = await current(tx, userId)
          return withLatestDocument(tx, userId, row)
        })
      } catch (error) {
        if (isPolicyViolation(error)) {
          throw new DocumentNotStoredError()
        }
        throw error
      }
    },
  }
}
