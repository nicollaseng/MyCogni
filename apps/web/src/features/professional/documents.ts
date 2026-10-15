import type { ProfessionalDocument, ProfessionalProfile } from '@mycogni/contracts'
import { professionalDocumentExtension, type Locale } from '@mycogni/domain'
import { sendUpload, type UploadResult } from '@/shared/lib/uploads'

export type DocumentState = 'missing' | ProfessionalProfile['status']

const megabyte = 1024 * 1024

export function documentStateOf(
  professional: Pick<ProfessionalProfile, 'status' | 'document'>,
): DocumentState {
  return professional.document === null ? 'missing' : professional.status
}

export function formatFileSize(bytes: number, locale: Locale): string {
  const [value, unit] =
    bytes >= megabyte ? [bytes / megabyte, 'megabyte'] : [bytes / 1024, 'kilobyte']
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)
}

export function documentFormat(document: Pick<ProfessionalDocument, 'contentType'>): string {
  return professionalDocumentExtension(document.contentType).toUpperCase()
}

export async function sendDocument(file: File): Promise<UploadResult<null>> {
  const body = new FormData()
  body.set('document', file)
  const result = await sendUpload('/uploads/document', { method: 'POST', body })
  return result.ok ? { ok: true, value: null } : result
}
