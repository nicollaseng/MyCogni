import { describe, expect, it, jest } from '@jest/globals'
import type { JournalPhotoOutputType, PhotoDimensions } from '@mycogni/domain'
import type { PhotoTools } from './photo-canvas'
import { fitsInPage, photoProblem, preparePhoto } from './photos'

const megabyte = 1024 * 1024

type Draw = (file: File, target: PhotoDimensions, type: JournalPhotoOutputType) => Promise<Blob>

function photoFile(type: string, size: number, name = 'foto.jpg'): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function tools(type: JournalPhotoOutputType = 'image/webp') {
  const draw = jest.fn<Draw>((_file, _target, output) =>
    Promise.resolve(new Blob(['encoded'], { type: output })),
  )
  const fake: PhotoTools = {
    read: () => Promise.resolve({ width: 1, height: 1 }),
    draw,
    outputType: () => type,
  }
  return { fake, draw }
}

describe('photoProblem', () => {
  it('accepts JPG, PNG, WebP, GIF and HEIC photos up to 40 MB before resizing', () => {
    expect(photoProblem({ type: 'image/jpeg', size: 30 * megabyte, name: 'a.jpg' })).toBeNull()
    expect(photoProblem({ type: 'image/png', size: 10 * megabyte, name: 'a.png' })).toBeNull()
    expect(photoProblem({ type: 'image/gif', size: 1, name: 'a.gif' })).toBeNull()
    expect(photoProblem({ type: 'image/heic', size: megabyte, name: 'a.heic' })).toBeNull()
  })

  it('refuses files that are not photos and photos too large to open', () => {
    expect(photoProblem({ type: 'application/pdf', size: megabyte, name: 'a.pdf' })).toBe(
      'notImage',
    )
    expect(photoProblem({ type: 'image/jpeg', size: 40 * megabyte + 1, name: 'a.jpg' })).toBe(
      'tooLarge',
    )
  })
})

describe('preparePhoto', () => {
  it('draws a large photo at the chosen size in the format the browser encodes', async () => {
    const { fake, draw } = tools('image/webp')
    const photo = { file: photoFile('image/jpeg', 6 * megabyte), width: 4000, height: 3000 }

    const ready = await preparePhoto(photo, 'medium', fake)

    expect(draw).toHaveBeenCalledWith(photo.file, { width: 1600, height: 1200 }, 'image/webp')
    expect(ready).toMatchObject({ width: 1600, height: 1200 })
    expect(ready.file.type).toBe('image/webp')
    expect(ready.file.name).toBe('photo.webp')
  })

  it('sends the original file untouched', async () => {
    const { fake, draw } = tools()
    const photo = {
      file: photoFile('image/png', 2 * megabyte, 'tela.png'),
      width: 3000,
      height: 2000,
    }

    expect(await preparePhoto(photo, 'original', fake)).toBe(photo)
    expect(draw).not.toHaveBeenCalled()
  })

  it('falls back to the high size when the original cannot be sent as it is', async () => {
    const { fake, draw } = tools('image/jpeg')
    const photo = {
      file: photoFile('image/heic', 2 * megabyte, 'a.heic'),
      width: 4032,
      height: 3024,
    }

    const ready = await preparePhoto(photo, 'original', fake)

    expect(draw).toHaveBeenCalledWith(photo.file, { width: 2560, height: 1920 }, 'image/jpeg')
    expect(ready.file.name).toBe('photo.jpg')
  })
})

describe('fitsInPage', () => {
  it('keeps a page within 30 photos', () => {
    expect(fitsInPage(28, 2)).toBe(true)
    expect(fitsInPage(29, 2)).toBe(false)
  })
})
