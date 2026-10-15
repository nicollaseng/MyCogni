import { isJournalImageType, journalLimits } from './journal.ts'

export const journalPhotoSizes = ['low', 'medium', 'high', 'original'] as const

export type JournalPhotoSize = (typeof journalPhotoSizes)[number]

export type ResizedPhotoSize = Exclude<JournalPhotoSize, 'original'>

export const defaultJournalPhotoSize: JournalPhotoSize = 'medium'

export const journalPhotoLongestSide: Readonly<Record<ResizedPhotoSize, number>> = {
  low: 1024,
  medium: 1600,
  high: 2560,
}

export const journalPhotoQuality = 0.82

export const journalPhotoSourceMaxBytes = 40 * 1024 * 1024

export const journalPhotoOutputTypes = ['image/webp', 'image/jpeg'] as const

export type JournalPhotoOutputType = (typeof journalPhotoOutputTypes)[number]

export type JournalPhotoProblem = 'notImage' | 'tooLarge'

export type OriginalPhotoProblem = 'tooLarge' | 'format'

export interface PhotoDimensions {
  width: number
  height: number
}

export interface PhotoSource extends PhotoDimensions {
  bytes: number
  type: string
}

export type PhotoPlan =
  | { kind: 'keep'; width: number; height: number; bytes: number }
  | { kind: 'resize'; width: number; height: number; bytes: number }
  | { kind: 'unavailable'; reason: OriginalPhotoProblem }

export interface ApproximateSize {
  amount: number
  unit: 'kilobyte' | 'megabyte'
}

interface PhotoFile {
  type: string
  name: string
  size: number
}

const kilobyte = 1024

const megabyte = kilobyte * kilobyte

const bytesPerPixel: Readonly<Record<JournalPhotoOutputType, number>> = {
  'image/jpeg': 0.2,
  'image/webp': 0.14,
}

const keptAsResized: ReadonlySet<string> = new Set(['image/jpeg', 'image/webp'])

const heicTypes: ReadonlySet<string> = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

const untypedFiles: ReadonlySet<string> = new Set(['', 'application/octet-stream'])

export function isJournalPhotoSize(value: unknown): value is JournalPhotoSize {
  return journalPhotoSizes.some((size) => size === value)
}

export function isHeicPhoto({ type, name }: Pick<PhotoFile, 'type' | 'name'>): boolean {
  return heicTypes.has(type) || (untypedFiles.has(type) && /\.hei[cf]$/i.test(name))
}

export function journalPhotoProblem(file: PhotoFile): JournalPhotoProblem | null {
  if (!isJournalImageType(file.type) && !isHeicPhoto(file)) {
    return 'notImage'
  }
  return file.size <= 0 || file.size > journalPhotoSourceMaxBytes ? 'tooLarge' : null
}

export function originalPhotoProblem(
  file: Pick<PhotoFile, 'type' | 'size'>,
): OriginalPhotoProblem | null {
  if (!isJournalImageType(file.type)) {
    return 'format'
  }
  return file.size > journalLimits.imageBytes ? 'tooLarge' : null
}

export function photoTarget(source: PhotoDimensions, longestSide: number): PhotoDimensions {
  const longest = Math.max(source.width, source.height)
  if (longest <= longestSide) {
    return { width: source.width, height: source.height }
  }
  const scale = longestSide / longest
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  }
}

export function estimatedPhotoBytes(
  dimensions: PhotoDimensions,
  type: JournalPhotoOutputType,
): number {
  return Math.round(dimensions.width * dimensions.height * bytesPerPixel[type])
}

export function planJournalPhoto(
  source: PhotoSource,
  size: JournalPhotoSize,
  output: JournalPhotoOutputType,
): PhotoPlan {
  if (size === 'original') {
    const problem = originalPhotoProblem({ type: source.type, size: source.bytes })
    return problem === null
      ? { kind: 'keep', width: source.width, height: source.height, bytes: source.bytes }
      : { kind: 'unavailable', reason: problem }
  }
  const target = photoTarget(source, journalPhotoLongestSide[size])
  const bytes = estimatedPhotoBytes(target, output)
  const untouched = target.width === source.width && target.height === source.height
  if (untouched && keptAsResized.has(source.type) && source.bytes <= bytes) {
    return { kind: 'keep', width: source.width, height: source.height, bytes: source.bytes }
  }
  return { kind: 'resize', width: target.width, height: target.height, bytes }
}

export function approximatePhotoSize(bytes: number): ApproximateSize {
  if (bytes >= 1000 * kilobyte) {
    return { amount: Math.round((bytes / megabyte) * 10) / 10, unit: 'megabyte' }
  }
  const kilobytes = bytes / kilobyte
  const rounded = kilobytes >= 100 ? Math.round(kilobytes / 10) * 10 : Math.round(kilobytes)
  return { amount: Math.max(1, rounded), unit: 'kilobyte' }
}
