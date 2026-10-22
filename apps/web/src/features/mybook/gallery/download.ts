import { dayKey } from '@mycogni/domain'

const coarsePointer = '(pointer: coarse)'

function extensionOf(path: string, type: string): string {
  const fromPath = /\.([a-z0-9]+)$/i.exec(path)?.[1]
  if (fromPath !== undefined) {
    return fromPath.toLowerCase()
  }
  return type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
}

export function photoFileName(
  writtenAt: Date,
  timeZone: string,
  position: number,
  path: string,
  type = '',
): string {
  return `mybook-${dayKey(writtenAt, timeZone)}-${String(position)}.${extensionOf(path, type)}`
}

function prefersSharing(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(coarsePointer).matches
}

function canShareFile(file: File): boolean {
  return 'canShare' in navigator && 'share' in navigator && navigator.canShare({ files: [file] })
}

function saveWithLink(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 10_000)
}

export async function downloadPhoto(url: string, name: (type: string) => string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return false
    }
    const blob = await response.blob()
    const file = new File([blob], name(blob.type), { type: blob.type })
    if (prefersSharing() && canShareFile(file)) {
      await navigator.share({ files: [file] })
      return true
    }
    saveWithLink(blob, file.name)
    return true
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError'
  }
}
