import { sendUpload, type UploadResult } from '@/shared/lib/uploads'

const endpoint = '/uploads/photo'

function uploadedUrl(value: unknown): string | null | undefined {
  if (typeof value !== 'object' || value === null || !('url' in value)) {
    return undefined
  }
  const { url } = value
  return typeof url === 'string' || url === null ? url : undefined
}

export async function sendPhoto(photo: File): Promise<UploadResult<string | null>> {
  const body = new FormData()
  body.set('photo', photo)
  const result = await sendUpload(endpoint, { method: 'POST', body })
  if (!result.ok) {
    return result
  }
  const url = uploadedUrl(result.value)
  return url === undefined ? { ok: false, problem: 'failed' } : { ok: true, value: url }
}

export async function deletePhoto(): Promise<UploadResult<null>> {
  const result = await sendUpload(endpoint, { method: 'DELETE' })
  return result.ok ? { ok: true, value: null } : result
}
