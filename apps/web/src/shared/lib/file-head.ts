import { signatureBytes } from '@mycogni/domain'

export async function fileHead(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, signatureBytes).arrayBuffer())
}
