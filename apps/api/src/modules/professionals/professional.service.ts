import type {
  EmergencyWhatsappInput,
  ProfessionalDocument,
  ProfessionalProfile,
  RegisterProfessionalInput,
  SubmitProfessionalDocumentInput,
  UpdateProfessionalInput,
} from '@mycogni/contracts'
import {
  councilOf,
  isOwnProfessionalDocumentPath,
  professionalDocumentName,
  registrationLabel,
  sniffDocumentType,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import {
  ConflictError,
  IdentityLockedError,
  NotFoundError,
  RegistrationTakenError,
  UnprocessableError,
  UnsupportedMediaTypeError,
} from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { fileHead } from '../../storage/file-head.ts'
import {
  DocumentNotStoredError,
  DuplicateRegistrationError,
  LockedIdentityError,
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
    registration: registrationLabel(record.registration),
    createdAt: record.createdAt.toISOString(),
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    document: record.document === null ? null : toDocument(record.document),
  }
}

async function guarded<T>(work: Promise<T>): Promise<T> {
  try {
    return await work
  } catch (error) {
    if (error instanceof DuplicateRegistrationError) {
      throw new RegistrationTakenError()
    }
    if (error instanceof LockedIdentityError) {
      throw new IdentityLockedError()
    }
    if (error instanceof DocumentNotStoredError) {
      throw new UnprocessableError('Upload the document to your folder before sending it')
    }
    throw error
  }
}

export function createProfessionalService(
  repository: ProfessionalRepository,
  documents: Pick<BucketStore, 'open'>,
): ProfessionalService {
  async function findOrFail(user: AuthenticatedUser): Promise<ProfessionalRecord> {
    const record = await repository.find(user.id)
    if (record === undefined) {
      throw new NotFoundError('Professional profile not found')
    }
    return record
  }

  function found(record: ProfessionalRecord | undefined): ProfessionalProfile {
    if (record === undefined) {
      throw new NotFoundError('Professional profile not found')
    }
    return toProfessional(record)
  }

  async function verifyDocumentContent(input: SubmitProfessionalDocumentInput): Promise<void> {
    const head = await fileHead(documents, input.path)
    if (head === null) {
      throw new UnprocessableError('Upload the document to your folder before sending it')
    }
    if (sniffDocumentType(head) !== input.contentType) {
      throw new UnsupportedMediaTypeError(
        'UNSUPPORTED_TYPE',
        'The document content is not the PDF, JPG or PNG it claims to be',
      )
    }
  }

  return {
    async get(user) {
      return toProfessional(await findOrFail(user))
    },
    async register(user, { kind, fullName, registration, institutionRegistration }) {
      const council = councilOf(kind)
      const record = await guarded(
        repository.create(user.id, {
          kind,
          fullName,
          registration:
            council === null || registration === null ? null : { council, ...registration },
          institutionRegistration,
        }),
      )
      if (record === undefined) {
        throw new ConflictError('Professional profile already exists')
      }
      return toProfessional(record)
    },
    async rename(user, input) {
      if ((await findOrFail(user)).status === 'verified') {
        throw new IdentityLockedError()
      }
      return found(await guarded(repository.rename(user.id, input.fullName)))
    },
    async setEmergencyWhatsapp(user, input) {
      return found(await repository.setEmergencyWhatsapp(user.id, input.emergencyWhatsapp))
    },
    async submitDocument(user, input) {
      if ((await findOrFail(user)).status === 'verified') {
        throw new ConflictError('This registration is already verified')
      }
      if (!isOwnProfessionalDocumentPath(input.path, user.id)) {
        throw new UnprocessableError('The document must be stored in your own folder')
      }
      await verifyDocumentContent(input)
      return found(
        await guarded(
          repository.submitDocument(user.id, {
            ...input,
            fileName: professionalDocumentName(input.fileName, input.contentType),
          }),
        ),
      )
    },
  }
}
