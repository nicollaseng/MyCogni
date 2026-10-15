const offsetBasis = 0xcbf29ce484222325n

const prime = 0x100000001b3n

const mask = (1n << 64n) - 1n

export function contentHash(text: string): string {
  let hash = offsetBasis
  for (let index = 0; index < text.length; index++) {
    hash = ((hash ^ BigInt(text.charCodeAt(index))) * prime) & mask
  }
  return hash.toString(16).padStart(16, '0')
}
