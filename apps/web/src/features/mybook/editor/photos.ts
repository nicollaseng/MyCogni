import {
  journalLimits,
  journalPhotoLongestSide,
  journalPhotoProblem,
  photoTarget,
  planJournalPhoto,
  type JournalPhotoSize,
  type PhotoDimensions,
} from '@mycogni/domain'
import { z } from 'zod'
import type { PhotoTools } from './photo-canvas'

export type PhotoProblem = 'notImage' | 'tooLarge' | 'tooMany' | 'failed'

export interface UploadedPhoto {
  path: string
  url: string
}

export interface ReadyPhoto extends PhotoDimensions {
  file: File
}

const uploadedSchema = z.object({ path: z.string().min(1), url: z.url() })

const extensions: Readonly<Record<string, string>> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
}

export function photoProblem(file: Pick<File, 'type' | 'size' | 'name'>): PhotoProblem | null {
  return journalPhotoProblem(file)
}

export function fitsInPage(current: number, adding: number): boolean {
  return current + adding <= journalLimits.imagesPerEntry
}

export async function preparePhoto(
  photo: ReadyPhoto,
  size: JournalPhotoSize,
  tools: PhotoTools,
): Promise<ReadyPhoto> {
  const type = tools.outputType()
  const source = { ...photo, bytes: photo.file.size, type: photo.file.type }
  const plan = planJournalPhoto(source, size, type)
  if (plan.kind === 'keep') {
    return photo
  }
  const target =
    plan.kind === 'resize'
      ? { width: plan.width, height: plan.height }
      : photoTarget(photo, journalPhotoLongestSide.high)
  const blob = await tools.draw(photo.file, target, type)
  const file = new File([blob], `photo.${extensions[blob.type] ?? 'jpg'}`, { type: blob.type })
  return { file, width: target.width, height: target.height }
}

export async function uploadPhoto(entryId: string, file: File): Promise<UploadedPhoto | null> {
  const body = new FormData()
  body.set('image', file)
  try {
    const response = await fetch(`/mybook/${encodeURIComponent(entryId)}/images`, {
      method: 'POST',
      body,
    })
    if (!response.ok) {
      return null
    }
    const parsed = uploadedSchema.safeParse(await response.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
