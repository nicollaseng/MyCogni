export const sniffedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const

export type SniffedType = (typeof sniffedTypes)[number]

export const signatureBytes = 12

const signatures: readonly { type: SniffedType; bytes: readonly number[]; offset: number }[] = [
  { type: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], offset: 0 },
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  { type: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
]

const riff = [0x52, 0x49, 0x46, 0x46]

function startsWith(content: Uint8Array, bytes: readonly number[], offset: number): boolean {
  return bytes.every((value, index) => content[offset + index] === value)
}

export function sniffFileType(content: Uint8Array): SniffedType | null {
  const match = signatures.find(
    ({ type, bytes, offset }) =>
      startsWith(content, bytes, offset) && (type !== 'image/webp' || startsWith(content, riff, 0)),
  )
  return match?.type ?? null
}

export function sniffOneOf<T extends string>(
  content: Uint8Array,
  accepts: (type: string) => type is T,
): T | null {
  const type = sniffFileType(content)
  return type !== null && accepts(type) ? type : null
}
