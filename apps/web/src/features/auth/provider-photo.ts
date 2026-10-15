import { serverEnv } from '@/shared/lib/env'

const providerPhotoTimeoutMs = 5000

type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export async function importProviderPhoto(
  accessToken: string,
  send: Fetcher = fetch,
): Promise<void> {
  try {
    const response = await send(`${serverEnv().apiUrl}/v1/me/photo/import`, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(providerPhotoTimeoutMs),
    })
    if (!response.ok) {
      console.error(`Importing the provider photo answered ${String(response.status)}`)
    }
  } catch (cause) {
    console.error(cause)
  }
}
