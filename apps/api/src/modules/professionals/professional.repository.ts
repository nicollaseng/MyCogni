import type {
  CouncilRegistration,
  ProfessionalDocumentType,
  ProfessionalKind,
  ProfessionalStatus,
  StoredRegistration,
} from '@mycogni/domain'
import { desc, eq, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { isPolicyViolation, isUniqueViolation } from '../../db/errors.ts'
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
  registration: StoredRegistration
  status: ProfessionalStatus
  reviewNote: string | null
  createdAt: Date
  verifiedAt: Date | null
  reviewedAt: Date | null
  emergencyWhatsapp: string | null
  document: ProfessionalDocumentRecord | null
}

export interface NewProfessional {
  kind: ProfessionalKind
  fullName: string
  registration: CouncilRegistration | null
  institutionRegistration: string | null
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

export class DuplicateRegistrationError extends Error {
  constructor() {
    super('Another account already holds this council registration')
    this.name = 'DuplicateRegistrationError'
  }
}

export class LockedIdentityError extends Error {
  constructor() {
    super('The identity of a verified professional is locked')
    this.name = 'LockedIdentityError'
  }
}

export interface ProfessionalRepository {
  find(userId: string): Promise<ProfessionalRecord | undefined>
  create(userId: string, professional: NewProfessional): Promise<ProfessionalRecord | undefined>
  rename(userId: string, fullName: string): Promise<ProfessionalRecord | undefined>
  setEmergencyWhatsapp(
    userId: string,
    emergencyWhatsapp: string | null,
  ): Promise<ProfessionalRecord | undefined>
  submitDocument(
    userId: string,
    document: NewProfessionalDocument,
  ): Promise<ProfessionalRecord | undefined>
}

export const registrationColumns = {
  council: professionalProfiles.registrationCouncil,
  uf: professionalProfiles.registrationUf,
  number: professionalProfiles.registrationNumber,
  text: professionalProfiles.registrationText,
}

const columns = {
  kind: professionalProfiles.kind,
  fullName: professionalProfiles.fullName,
  registration: registrationColumns,
  status: professionalProfiles.status,
  reviewNote: professionalProfiles.reviewNote,
  createdAt: professionalProfiles.createdAt,
  verifiedAt: professionalProfiles.verifiedAt,
  reviewedAt: professionalProfiles.reviewedAt,
  emergencyWhatsapp: sql<string | null>`public.own_emergency_whatsapp()`,
}

export const documentColumns = {
  id: professionalDocuments.id,
  fileName: professionalDocuments.fileName,
  contentType: professionalDocuments.contentType,
  sizeBytes: professionalDocuments.sizeBytes,
  createdAt: professionalDocuments.createdAt,
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

const registrationKey = 'professional_profiles_registration_key'

async function translated<T>(work: Promise<T>, policyError?: () => Error): Promise<T> {
  try {
    return await work
  } catch (error) {
    if (isUniqueViolation(error, registrationKey)) {
      throw new DuplicateRegistrationError()
    }
    if (policyError !== undefined && isPolicyViolation(error)) {
      throw policyError()
    }
    throw error
  }
}

export function createProfessionalRepository(db: Database): ProfessionalRepository {
  function current(tx: Transaction, userId: string) {
    return tx
      .select(columns)
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
  }

  async function currentWithDocument(
    tx: Transaction,
    userId: string,
  ): Promise<ProfessionalRecord | undefined> {
    const [row] = await current(tx, userId)
    return withLatestDocument(tx, userId, row)
  }

  return {
    find(userId) {
      return withUser(db, userId, (tx) => currentWithDocument(tx, userId))
    },
    create(userId, { kind, fullName, registration, institutionRegistration }) {
      return translated(
        withUser(db, userId, async (tx) => {
          const [row] = await tx
            .insert(professionalProfiles)
            .values({
              userId,
              kind,
              fullName,
              registrationCouncil: registration?.council ?? null,
              registrationUf: registration?.uf ?? null,
              registrationNumber: registration?.number ?? null,
              registrationText: institutionRegistration,
            })
            .onConflictDoNothing({ target: professionalProfiles.userId })
            .returning({ userId: professionalProfiles.userId })
          return row === undefined ? undefined : currentWithDocument(tx, userId)
        }),
      )
    },
    rename(userId, fullName) {
      return translated(
        withUser(db, userId, async (tx) => {
          await tx
            .update(professionalProfiles)
            .set({ fullName })
            .where(eq(professionalProfiles.userId, userId))
          return currentWithDocument(tx, userId)
        }),
        () => new LockedIdentityError(),
      )
    },
    setEmergencyWhatsapp(userId, emergencyWhatsapp) {
      return withUser(db, userId, async (tx) => {
        await tx
          .update(professionalProfiles)
          .set({ emergencyWhatsapp })
          .where(eq(professionalProfiles.userId, userId))
        return currentWithDocument(tx, userId)
      })
    },
    submitDocument(userId, document) {
      return translated(
        withUser(db, userId, async (tx) => {
          await tx.insert(professionalDocuments).values({ ...document, userId })
          await tx.execute(sql`select public.reopen_professional_review()`)
          return currentWithDocument(tx, userId)
        }),
        () => new DocumentNotStoredError(),
      )
    },
  }
}
