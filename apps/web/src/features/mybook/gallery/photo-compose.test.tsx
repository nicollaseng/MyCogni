import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import type { JournalPhotoSize, PhotoDimensions } from '@mycogni/domain'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { installVisualViewport } from '@/test/visual-viewport'
import type { PhotoTools } from '../editor/photo-canvas'
import { photoSizeKey } from '../editor/photo-size-choice'
import type { ComposedPhoto } from '../editor/photos'
import { PhotoCompose } from './photo-compose'

const megabyte = 1024 * 1024

type Add = (photos: readonly ComposedPhoto[], size: JournalPhotoSize) => void

function photoFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function toolsReading(read: (file: File) => Promise<PhotoDimensions>): PhotoTools {
  return { read, draw: () => Promise.resolve(new Blob()), outputType: () => 'image/jpeg' }
}

const camera = toolsReading(() => Promise.resolve({ width: 4000, height: 3000 }))

function compose(files: File[], tools: PhotoTools = camera) {
  const onAdd = jest.fn<Add>()
  const onClose = jest.fn<() => void>()
  renderWithIntl(
    <PhotoCompose
      photos={files.map((file) => ({ file, preview: `blob:${file.name}` }))}
      tools={tools}
      onAdd={onAdd}
      onClose={onClose}
    />,
  )
  return { onAdd, onClose, dialog: within(screen.getByRole('dialog')) }
}

function send() {
  return userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

beforeAll(() => {
  Element.prototype.scrollTo = () => undefined
})

afterEach(() => {
  window.localStorage.clear()
})

describe('PhotoCompose', () => {
  it('adds one photo with its caption at the remembered size', async () => {
    const file = photoFile('parque.jpg', 'image/jpeg', 6 * megabyte)
    const { onAdd, onClose, dialog } = compose([file])

    expect(screen.getByRole('dialog', { name: 'Adicionar foto' })).toBeInTheDocument()
    expect(dialog.queryByRole('group', { name: 'Fotos escolhidas' })).not.toBeInTheDocument()
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Legenda da foto 1 de 1' }),
      '  Fim de tarde  ',
    )
    await waitFor(() => {
      expect(dialog.getByRole('button', { name: 'Adicionar' })).toBeEnabled()
    })
    await send()

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        [{ file, width: 4000, height: 3000, caption: 'Fim de tarde' }],
        'medium',
      )
    })
    expect(onClose).toHaveBeenCalled()
    expect(window.localStorage.getItem(photoSizeKey)).toBe('medium')
  })

  it('keeps one caption per photo while moving through the thumbnails', async () => {
    const first = photoFile('a.jpg', 'image/jpeg', megabyte)
    const second = photoFile('b.jpg', 'image/jpeg', megabyte)
    const { onAdd, dialog } = compose([first, second])
    const strip = within(dialog.getByRole('group', { name: 'Fotos escolhidas' }))

    expect(strip.getByRole('button', { name: 'Foto 1 de 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.type(dialog.getByRole('textbox', { name: 'Legenda da foto 1 de 2' }), 'Lago')
    await userEvent.click(strip.getByRole('button', { name: 'Foto 2 de 2' }))
    const caption = dialog.getByRole('textbox', { name: 'Legenda da foto 2 de 2' })
    expect(caption).toHaveValue('')
    await userEvent.type(caption, 'Ponte')
    await send()

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        [
          { file: first, width: 4000, height: 3000, caption: 'Lago' },
          { file: second, width: 4000, height: 3000, caption: 'Ponte' },
        ],
        'medium',
      )
    })
  })

  it('switches to HD from the quality choice and remembers it', async () => {
    const { onAdd, dialog } = compose([photoFile('a.jpg', 'image/jpeg', 2 * megabyte)])
    const quality = dialog.getByRole('button', { name: 'Qualidade: Média' })
    expect(quality).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(quality)
    await waitFor(() => {
      expect(dialog.getByRole('radio', { name: /^Média/ })).toHaveAccessibleName(
        /Até 1600 px ≈ 380 kB/,
      )
    })
    await userEvent.click(dialog.getByRole('radio', { name: /^Alta/ }))

    expect(dialog.getByRole('button', { name: 'Qualidade: Alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await send()
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(expect.any(Array), 'high')
    })
    expect(window.localStorage.getItem(photoSizeKey)).toBe('high')
  })

  it('refuses captions with markup', async () => {
    const { dialog } = compose([photoFile('a.jpg', 'image/jpeg', megabyte)])

    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Legenda da foto 1 de 1' }),
      '<b>x</b>',
    )

    expect(
      dialog.getByText('Use só texto nas legendas, com até 500 caracteres.'),
    ).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
  })

  it('discards everything when cancelled', async () => {
    const { onAdd, onClose, dialog } = compose([photoFile('a.jpg', 'image/jpeg', megabyte)])

    await userEvent.type(dialog.getByRole('textbox', { name: 'Legenda da foto 1 de 1' }), 'Lago')
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('says when the browser cannot open a HEIC photo', async () => {
    const heic = toolsReading(() => Promise.reject(new Error('Cannot decode')))
    const { onAdd, dialog } = compose([photoFile('IMG_0001.HEIC', 'image/heic', megabyte)], heic)

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Este navegador não abre fotos HEIC. Converta a foto para JPG e tente de novo.',
    )
    expect(dialog.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('keeps the caption above the on-screen keyboard', () => {
    const viewport = installVisualViewport()
    const { dialog } = compose([photoFile('a.jpg', 'image/jpeg', megabyte)])
    const bar = dialog
      .getByRole('textbox', { name: 'Legenda da foto 1 de 1' })
      .closest('div.shrink-0')

    viewport.showKeyboard(300)

    expect(bar).toHaveStyle({ paddingBottom: '312px' })
    viewport.remove()
  })
})
