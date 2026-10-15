import { z } from 'zod'
import { sendUpload, type UploadResult } from '@/shared/lib/uploads'

const uploadedSchema = z.object({ url: z.url().nullable() })

const endpoint = '/uploads/photo'

export async function sendPhoto(photo: File): Promise<UploadResult<string | null>> {
  const body = new FormData()
  body.set('photo', photo)
  const result = await sendUpload(endpoint, { method: 'POST', body })
  if (!result.ok) {
    return result
  }
  const parsed = uploadedSchema.safeParse(result.value)
  return parsed.success ? { ok: true, value: parsed.data.url } : { ok: false, problem: 'failed' }
}

export async function deletePhoto(): Promise<UploadResult<null>> {
  const result = await sendUpload(endpoint, { method: 'DELETE' })
  return result.ok ? { ok: true, value: null } : result
}
