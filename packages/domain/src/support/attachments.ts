import { cleanFileName, type UploadCandidate, type UploadProblem } from '../files/uploads.ts'

export const supportAttachmentBucket = 'support-attachments'

export const supportImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export const supportFileTypes = ['application/pdf', 'text/plain'] as const

export const supportAttachmentTypes = [...supportImageTypes, ...supportFileTypes] as const

export const supportConvertibleImageTypes = ['image/heic', 'image/heif'] as const

export type SupportAttachmentType = (typeof supportAttachmentTypes)[number]

export type SupportAttachmentKind = 'image' | 'file'

export const supportAttachmentLimits = {
  imageBytes: 5 * 1024 * 1024,
  fileBytes: 2 * 1024 * 1024,
  fileName: 200,
} as const

const extensions: Readonly<Record<SupportAttachmentType, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
}

export function isSupportAttachmentType(type: string): type is SupportAttachmentType {
  return supportAttachmentTypes.some((candidate) => candidate === type)
}

export function isConvertibleSupportImage(type: string): boolean {
  return supportConvertibleImageTypes.some((candidate) => candidate === type)
}

export function supportAttachmentKind(type: SupportAttachmentType): SupportAttachmentKind {
  return supportImageTypes.some((candidate) => candidate === type) ? 'image' : 'file'
}

export function supportAttachmentMaxBytes(type: SupportAttachmentType): number {
  return supportAttachmentKind(type) === 'image'
    ? supportAttachmentLimits.imageBytes
    : supportAttachmentLimits.fileBytes
}

export function supportAttachmentExtension(type: SupportAttachmentType): string {
  return extensions[type]
}

export function supportAttachmentProblem(file: UploadCandidate): UploadProblem | null {
  if (!isSupportAttachmentType(file.type)) {
    return 'type'
  }
  return file.size <= 0 || file.size > supportAttachmentMaxBytes(file.type) ? 'size' : null
}

export function isOwnSupportAttachmentPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|png|webp|pdf|txt)$`).test(path)
}

export function supportAttachmentName(name: string, type: SupportAttachmentType): string {
  return (
    cleanFileName(name, supportAttachmentLimits.fileName) ||
    `attachment.${supportAttachmentExtension(type)}`
  )
}
