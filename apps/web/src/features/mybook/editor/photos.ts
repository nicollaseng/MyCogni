import { isJournalImageType, journalLimits } from '@mycogni/domain'
import { z } from 'zod'

export type PhotoProblem = 'notImage' | 'tooLarge' | 'tooMany' | 'failed'

export interface UploadedPhoto {
  path: string
  url: string
}

const uploadedSchema = z.object({ path: z.string().min(1), url: z.url() })

export function photoProblem(file: Pick<File, 'type' | 'size'>): PhotoProblem | null {
  if (!isJournalImageType(file.type)) {
    return 'notImage'
  }
  return file.size > journalLimits.imageBytes ? 'tooLarge' : null
}

export function fitsInPage(current: number, adding: number): boolean {
  return current + adding <= journalLimits.imagesPerEntry
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
