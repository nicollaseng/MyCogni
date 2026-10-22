import { sniffOneOf } from '../files/signatures.ts'
import {
  cleanFileName,
  uploadProblem,
  type UploadCandidate,
  type UploadProblem,
} from '../files/uploads.ts'
import type { ProfessionalKind } from './professionals.ts'

export const professionalDocumentBucket = 'professional-documents'

export const professionalDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png'] as const

export type ProfessionalDocumentType = (typeof professionalDocumentTypes)[number]

export const professionalDocumentLimits = {
  bytes: 10 * 1024 * 1024,
  fileName: 200,
  reviewNote: 500,
} as const

const extensions: Readonly<Record<ProfessionalDocumentType, string>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export function isProfessionalDocumentType(type: string): type is ProfessionalDocumentType {
  return professionalDocumentTypes.some((candidate) => candidate === type)
}

export function professionalDocumentExtension(type: ProfessionalDocumentType): string {
  return extensions[type]
}

export function sniffDocumentType(content: Uint8Array): ProfessionalDocumentType | null {
  return sniffOneOf(content, isProfessionalDocumentType)
}

export function professionalDocumentProblem(file: UploadCandidate): UploadProblem | null {
  return uploadProblem(file, {
    accepts: isProfessionalDocumentType,
    maxBytes: professionalDocumentLimits.bytes,
  })
}

export function isOwnProfessionalDocumentPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/[0-9a-f-]{36}\\.(pdf|jpg|png)$`).test(path)
}

export function professionalDocumentName(name: string, type: ProfessionalDocumentType): string {
  return (
    cleanFileName(name, professionalDocumentLimits.fileName) ||
    `document.${professionalDocumentExtension(type)}`
  )
}

export const registrationProofs = ['crp', 'crm', 'institution'] as const

export type RegistrationProof = (typeof registrationProofs)[number]

const proofs: Readonly<Record<ProfessionalKind, RegistrationProof>> = {
  psychologist: 'crp',
  psychiatrist: 'crm',
  physician: 'crm',
  psychoanalyst: 'institution',
}

export function registrationProofOf(kind: ProfessionalKind): RegistrationProof {
  return proofs[kind]
}
