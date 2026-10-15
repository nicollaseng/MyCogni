import { avatarRenderSize } from '@mycogni/domain'
import { decodeImage } from '@/shared/lib/decode-image'
import { centeredSquare, radiansOf, rotatedSize, type CropArea } from './photo-geometry'

export type RenderPhoto = (source: Blob, area: CropArea | null, rotation: number) => Promise<File>

export const renderPhoto: RenderPhoto = async (source, area, rotation) => {
  const { image, width, height, close } = await decodeImage(source)
  const box = rotatedSize({ width, height }, rotation)
  const crop = area ?? centeredSquare(box)
  const canvas = document.createElement('canvas')
  canvas.width = avatarRenderSize
  canvas.height = avatarRenderSize
  const context = canvas.getContext('2d')
  if (context === null) {
    close()
    throw new Error('Canvas is not available')
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, avatarRenderSize, avatarRenderSize)
  context.imageSmoothingQuality = 'high'
  context.scale(avatarRenderSize / crop.width, avatarRenderSize / crop.height)
  context.translate(box.width / 2 - crop.x, box.height / 2 - crop.y)
  context.rotate(radiansOf(rotation))
  context.drawImage(image, -width / 2, -height / 2)
  close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.86)
  })
  if (blob === null) {
    throw new Error('The photo could not be encoded')
  }
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
}
