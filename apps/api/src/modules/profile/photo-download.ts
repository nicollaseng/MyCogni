import { avatarMaxBytes, isAvatarType, sniffAvatarType, type AvatarType } from '@mycogni/domain'

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export interface DownloadedPhoto {
  content: Uint8Array
  type: AvatarType
}

export interface DownloadLimits {
  maxBytes: number
  timeoutMs: number
}

export const photoDownloadLimits: DownloadLimits = { maxBytes: avatarMaxBytes, timeoutMs: 5000 }

function declaredType(response: Response): string {
  const [type = ''] = (response.headers.get('content-type') ?? '').split(';')
  return type.trim().toLowerCase()
}

async function readUpTo(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      return Buffer.concat(chunks)
    }
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
}

export async function downloadPhoto(
  fetcher: Fetcher,
  url: string,
  { maxBytes, timeoutMs }: DownloadLimits = photoDownloadLimits,
): Promise<DownloadedPhoto | null> {
  const response = await fetcher(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept: 'image/jpeg, image/png, image/webp' },
  })
  const type = declaredType(response)
  const length = Number(response.headers.get('content-length') ?? '0')
  if (!response.ok || response.body === null || !isAvatarType(type) || length > maxBytes) {
    await response.body?.cancel()
    return null
  }
  const content = await readUpTo(response.body, maxBytes)
  if (content === null || content.byteLength === 0 || sniffAvatarType(content) !== type) {
    return null
  }
  return { content, type }
}
