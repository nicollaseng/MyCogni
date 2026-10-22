import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { renderWithIntl } from '@/test/render'
import { PhotoViewer, type ViewerActions, type ViewerPhoto } from './photo-viewer'

const photos: ViewerPhoto[] = [
  { key: 'a', src: 'https://storage.local/a.webp', caption: 'Praia' },
  { key: 'b', src: 'https://storage.local/b.webp', caption: '' },
  { key: 'c', src: 'https://storage.local/c.webp', caption: 'Mar à tarde' },
]

function actionsWith(overrides: Partial<ViewerActions> = {}): ViewerActions {
  return {
    download: jest.fn<ViewerActions['download']>(() => Promise.resolve(true)),
    saveCaption: jest.fn<ViewerActions['saveCaption']>(() => Promise.resolve(true)),
    remove: jest.fn<ViewerActions['remove']>(() => Promise.resolve(true)),
    ...overrides,
  }
}

function Harness({
  actions,
  start,
  onClose,
}: {
  actions: ViewerActions | null
  start: string
  onClose: (last: string | null) => void
}) {
  const [list, setList] = useState(photos)
  return (
    <PhotoViewer
      photos={list}
      start={start}
      onClose={onClose}
      actions={
        actions === null
          ? null
          : {
              ...actions,
              remove: async (photo) => {
                const done = await actions.remove(photo)
                setList((current) => current.filter((item) => item.key !== photo.key))
                return done
              },
            }
      }
    />
  )
}

function open(actions: ViewerActions | null = actionsWith(), start = 'b') {
  const onClose = jest.fn<(last: string | null) => void>()
  renderWithIntl(<Harness actions={actions} start={start} onClose={onClose} />)
  return { onClose, actions }
}

function title() {
  return screen.getByRole('heading', { level: 2 })
}

describe('PhotoViewer', () => {
  it('opens on the chosen photo with its position and moves with the arrows and the keys', async () => {
    open()

    expect(screen.getByRole('dialog', { name: 'Foto 2 de 3' })).toBeInTheDocument()
    expect(title()).toHaveTextContent('2 de 3')

    await userEvent.keyboard('{ArrowRight}')
    expect(title()).toHaveTextContent('3 de 3')
    expect(screen.getByText('Mar à tarde')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Próxima foto' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Foto anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Foto anterior' }))
    expect(title()).toHaveTextContent('1 de 3')
    expect(screen.getByRole('img', { name: 'Praia' })).toBeInTheDocument()
  })

  it('moves to the next photo with a swipe', () => {
    open()
    const stage = screen.getByRole('img', { name: 'Foto da página' }).closest('div')?.parentElement
    if (!stage) {
      throw new Error('No photo stage')
    }

    fireEvent(stage, new MouseEvent('pointerdown', { bubbles: true, clientX: 300 }))
    fireEvent(stage, new MouseEvent('pointerup', { bubbles: true, clientX: 120 }))

    expect(title()).toHaveTextContent('3 de 3')
  })

  it('closes with Escape and says which photo was shown last', async () => {
    const { onClose } = open(actionsWith(), 'c')

    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('c')
    })
  })

  it('downloads the photo on screen', async () => {
    const { actions } = open()

    await userEvent.click(screen.getByRole('button', { name: 'Baixar' }))

    expect(actions?.download).toHaveBeenCalledWith(photos[1], 1)
  })

  it('edits the caption and refuses markup', async () => {
    const { actions } = open(actionsWith(), 'a')

    await userEvent.click(screen.getByRole('button', { name: 'Editar legenda' }))
    const field = screen.getByRole('textbox', { name: 'Legenda' })
    expect(field).toHaveValue('Praia')

    await userEvent.clear(field)
    await userEvent.type(field, '<b>x</b>')
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    expect(screen.getByText('Use só texto, com até 500 caracteres.')).toBeInTheDocument()

    await userEvent.clear(field)
    await userEvent.type(field, '  Praia com a Ana  ')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(actions?.saveCaption).toHaveBeenCalledWith(photos[0], 'Praia com a Ana')
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'Legenda' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('deletes a photo only after the confirmation', async () => {
    const { actions } = open()

    await userEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Apagar esta foto?' })
    expect(actions?.remove).not.toHaveBeenCalled()

    await userEvent.click(within(confirm).getByRole('button', { name: 'Apagar' }))

    expect(actions?.remove).toHaveBeenCalledWith(photos[1])
    await waitFor(() => {
      expect(title()).toHaveTextContent('2 de 2')
    })
    expect(screen.getByText('Mar à tarde')).toBeInTheDocument()
  })

  it('tells when a download fails', async () => {
    open(actionsWith({ download: () => Promise.resolve(false) }))

    await userEvent.click(screen.getByRole('button', { name: 'Baixar' }))

    expect(
      await screen.findByText('Não conseguimos baixar a foto. Tente de novo.'),
    ).toBeInTheDocument()
  })

  it('only shows the photos to someone who cannot change them', () => {
    open(null)

    expect(screen.getByRole('dialog', { name: 'Foto 2 de 3' })).toBeInTheDocument()
    for (const name of ['Baixar', 'Editar legenda', 'Apagar']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
  })
})
