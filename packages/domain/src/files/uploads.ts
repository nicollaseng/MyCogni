export type UploadProblem = 'type' | 'size'

export interface UploadCandidate {
  type: string
  size: number
}

export interface UploadRule {
  accepts: (type: string) => boolean
  maxBytes: number
}

export function uploadProblem(file: UploadCandidate, rule: UploadRule): UploadProblem | null {
  if (!rule.accepts(file.type)) {
    return 'type'
  }
  return file.size <= 0 || file.size > rule.maxBytes ? 'size' : null
}

export function cleanFileName(name: string, maxLength: number): string {
  return name
    .replace(/[\\/\p{Cc}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim()
}
