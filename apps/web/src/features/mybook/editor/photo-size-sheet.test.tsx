import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { JournalPhotoSize, PhotoDimensions } from '@mycogni/domain'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import type { PhotoTools } from './photo-canvas'
import { photoSizeKey } from './photo-size-choice'
import { PhotoSizeSheet } from './photo-size-sheet'
import type { ReadyPhoto } from './photos'

const megabyte = 1024 * 1024

type Add = (photos: readonly ReadyPhoto[], size: JournalPhotoSize) => void

function photoFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function toolsReading(read: (file: File) => Promise<PhotoDimensions>): PhotoTools {
  return {
    read,
    draw: () => Promise.resolve(new Blob()),
    outputType: () => 'image/jpeg',
  }
}

const camera = toolsReading(() => Promise.resolve({ width: 4000, height: 3000 }))

function renderSheet(files: File[], tools: PhotoTools = camera) {
  const onAdd = jest.fn<Add>()
  renderWithIntl(
    <PhotoSizeSheet
      photos={files.map((file) => ({ file, preview: `blob:${file.name}` }))}
      tools={tools}
      onAdd={onAdd}
      onClose={() => undefined}
    />,
  )
  return { onAdd, sheet: within(screen.getByRole('dialog')) }
}

afterEach(() => {
  window.localStorage.clear()
})

describe('PhotoSizeSheet', () => {
  it('starts on the medium size, shows each size after reading the photo and adds it', async () => {
    const file = photoFile('parque.jpg', 'image/jpeg', 6 * megabyte)
    const { onAdd, sheet } = renderSheet([file])

    expect(screen.getByRole('dialog', { name: 'Adicionar foto' })).toBeInTheDocument()
    expect(sheet.getByRole('radio', { name: /^Média/ })).toBeChecked()
    expect(sheet.getByRole('radio', { name: /^Original/ })).toHaveAccessibleName(
      /O arquivo como está 6 MB/,
    )
    await waitFor(() => {
      expect(sheet.getByRole('radio', { name: /^Média/ })).toHaveAccessibleName(
        /Até 1600 px ≈ 380 kB/,
      )
    })
    expect(sheet.getByRole('radio', { name: /^Baixa/ })).toHaveAccessibleName(/≈ 150 kB/)

    await userEvent.click(sheet.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith([{ file, width: 4000, height: 3000 }], 'medium')
    })
    expect(window.localStorage.getItem(photoSizeKey)).toBe('medium')
  })

  it('remembers the last size chosen on this device', async () => {
    window.localStorage.setItem(photoSizeKey, 'low')
    const { onAdd, sheet } = renderSheet([photoFile('a.jpg', 'image/jpeg', 2 * megabyte)])

    expect(sheet.getByRole('radio', { name: /^Baixa/ })).toBeChecked()
    await userEvent.click(sheet.getByRole('radio', { name: /^Alta/ }))
    await userEvent.click(await sheet.findByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(expect.any(Array), 'high')
    })
    expect(window.localStorage.getItem(photoSizeKey)).toBe('high')
  })

  it('explains why the original is too large and suggests the high size', async () => {
    window.localStorage.setItem(photoSizeKey, 'original')
    const { onAdd, sheet } = renderSheet([photoFile('grande.jpg', 'image/jpeg', 12 * megabyte)])

    const original = sheet.getByRole('radio', { name: /^Original/ })
    expect(original).toBeDisabled()
    expect(original).toHaveAccessibleName(/Passa de 10 MB\. Use Alta\. 12 MB/)
    expect(sheet.getByRole('radio', { name: /^Alta/ })).toBeChecked()

    await userEvent.click(sheet.getByRole('button', { name: 'Adicionar' }))
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(expect.any(Array), 'high')
    })
  })

  it('says when the browser cannot open a HEIC photo', async () => {
    const heic = toolsReading(() => Promise.reject(new Error('Cannot decode')))
    const { onAdd, sheet } = renderSheet([photoFile('IMG_0001.HEIC', 'image/heic', megabyte)], heic)

    expect(await sheet.findByRole('alert')).toHaveTextContent(
      'Este navegador não abre fotos HEIC. Converta a foto para JPG e tente de novo.',
    )
    expect(sheet.getByRole('radio', { name: /^Original/ })).toBeDisabled()
    expect(sheet.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows several photos together and adds the ones it could open', async () => {
    const read = jest
      .fn<(file: File) => Promise<PhotoDimensions>>()
      .mockResolvedValueOnce({ width: 1200, height: 900 })
      .mockRejectedValueOnce(new Error('Broken'))
    const opened = photoFile('a.jpg', 'image/jpeg', megabyte)
    const broken = photoFile('b.png', 'image/png', megabyte)
    const { onAdd, sheet } = renderSheet([opened, broken], toolsReading(read))

    expect(screen.getByRole('dialog', { name: 'Adicionar 2 fotos' })).toBeInTheDocument()
    expect(await sheet.findByRole('alert')).toHaveTextContent(
      'Não conseguimos abrir esta foto. Escolha outra.',
    )
    await userEvent.click(sheet.getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith([{ file: opened, width: 1200, height: 900 }], 'medium')
    })
  })
})
