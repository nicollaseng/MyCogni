export interface DecodedImage {
  image: CanvasImageSource
  width: number
  height: number
  close: () => void
}

async function decodeAsElement(source: Blob): Promise<DecodedImage> {
  const url = URL.createObjectURL(source)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => undefined,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function decodeImage(source: Blob): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => {
        bitmap.close()
      },
    }
  } catch {
    return decodeAsElement(source)
  }
}
