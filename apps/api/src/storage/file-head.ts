import { signatureBytes } from '@mycogni/domain'
import type { BucketStore } from './bucket-store.ts'

async function opened(store: Pick<BucketStore, 'open'>, path: string) {
  try {
    return await store.open(path)
  } catch {
    return null
  }
}

export async function fileHead(
  store: Pick<BucketStore, 'open'>,
  path: string,
  size: number = signatureBytes,
): Promise<Uint8Array | null> {
  const stream = await opened(store, path)
  if (stream === null) {
    return null
  }
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (total < size) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      chunks.push(value)
      total += value.byteLength
    }
  } finally {
    await reader.cancel()
  }
  return Buffer.concat(chunks).subarray(0, size)
}
