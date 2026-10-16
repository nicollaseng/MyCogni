import type {
  EmergencyWhatsappInput,
  ProfessionalDocument,
  ProfessionalProfile,
  RegisterProfessionalInput,
  SubmitProfessionalDocumentInput,
  UpdateProfessionalInput,
} from '@mycogni/contracts'
import { isOwnProfessionalDocumentPath, professionalDocumentName } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ConflictError, NotFoundError, UnprocessableError } from '../../shared/errors.ts'
import {
  DocumentNotStoredError,
  type ProfessionalDocumentRecord,
  type ProfessionalRecord,
  type ProfessionalRepository,
} from './professional.repository.ts'

export interface ProfessionalService {
  get(user: AuthenticatedUser): Promise<ProfessionalProfile>
  register(user: AuthenticatedUser, input: RegisterProfessionalInput): Promise<ProfessionalProfile>
  rename(user: AuthenticatedUser, input: UpdateProfessionalInput): Promise<ProfessionalProfile>
  setEmergencyWhatsapp(
    user: AuthenticatedUser,
    input: EmergencyWhatsappInput,
  ): Promise<ProfessionalProfile>
  submitDocument(
    user: AuthenticatedUser,
    input: SubmitProfessionalDocumentInput,
  ): Promise<ProfessionalProfile>
}

export function toDocument(record: ProfessionalDocumentRecord): ProfessionalDocument {
  return { ...record, createdAt: record.createdAt.toISOString() }
}

function toProfessional(record: ProfessionalRecord): ProfessionalProfile {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    document: record.document === null ? null : toDocument(record.document),
  }
}

export function createProfessionalService(repository: ProfessionalRepository): ProfessionalService {
  async function findOrFail(user: AuthenticatedUser): Promise<ProfessionalRecord> {
    const record = await repository.find(user.id)
    if (record === undefined) {
      throw new NotFoundError('Professional profile not found')
    }
    return record
  }

  return {
    async get(user) {
      return toProfessional(await findOrFail(user))
    },
    async register(user, input) {
      const record = await repository.create(user.id, input)
      if (record === undefined) {
        throw new ConflictError('Professional profile already exists')
      }
      return toProfessional(record)
    },
    async rename(user, input) {
      const record = await repository.rename(user.id, input.fullName)
      if (record === undefined) {
        throw new NotFoundError('Professional profile not found')
      }
      return toProfessional(record)
    },
    async setEmergencyWhatsapp(user, input) {
      const record = await repository.setEmergencyWhatsapp(user.id, input.emergencyWhatsapp)
      if (record === undefined) {
        throw new NotFoundError('Professional profile not found')
      }
      return toProfessional(record)
    },
    async submitDocument(user, input) {
      if ((await findOrFail(user)).status === 'verified') {
        throw new ConflictError('This registration is already verified')
      }
      if (!isOwnProfessionalDocumentPath(input.path, user.id)) {
        throw new UnprocessableError('The document must be stored in your own folder')
      }
      try {
        const record = await repository.submitDocument(user.id, {
          ...input,
          fileName: professionalDocumentName(input.fileName, input.contentType),
        })
        if (record === undefined) {
          throw new NotFoundError('Professional profile not found')
        }
        return toProfessional(record)
      } catch (error) {
        if (error instanceof DocumentNotStoredError) {
          throw new UnprocessableError('Upload the document to your folder before sending it')
        }
        throw error
      }
    },
  }
}
