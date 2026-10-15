import {
  journalPhotoQuality,
  type JournalPhotoOutputType,
  type PhotoDimensions,
} from '@mycogni/domain'
import { decodeImage } from '@/shared/lib/decode-image'

export interface PhotoTools {
  read: (file: File) => Promise<PhotoDimensions>
  draw: (file: File, target: PhotoDimensions, type: JournalPhotoOutputType) => Promise<Blob>
  outputType: () => JournalPhotoOutputType
}

let webpSupport: boolean | undefined

function supportsWebp(): boolean {
  if (webpSupport === undefined) {
    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    webpSupport = probe.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return webpSupport
}

async function read(file: File): Promise<PhotoDimensions> {
  const decoded = await decodeImage(file)
  decoded.close()
  return { width: decoded.width, height: decoded.height }
}

async function draw(
  file: File,
  target: PhotoDimensions,
  type: JournalPhotoOutputType,
): Promise<Blob> {
  const decoded = await decodeImage(file)
  const canvas = document.createElement('canvas')
  try {
    canvas.width = target.width
    canvas.height = target.height
    const context = canvas.getContext('2d')
    if (context === null) {
      throw new Error('Canvas is not available')
    }
    if (type === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, target.width, target.height)
    }
    context.imageSmoothingQuality = 'high'
    context.drawImage(decoded.image, 0, 0, target.width, target.height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, journalPhotoQuality)
    })
    if (blob === null) {
      throw new Error('The photo could not be encoded')
    }
    return blob
  } finally {
    decoded.close()
    canvas.width = 0
    canvas.height = 0
  }
}

export const browserPhotoTools: PhotoTools = {
  read,
  draw,
  outputType: () => (supportsWebp() ? 'image/webp' : 'image/jpeg'),
}
