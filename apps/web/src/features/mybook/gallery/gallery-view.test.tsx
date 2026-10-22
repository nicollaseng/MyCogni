import { beforeAll, describe, expect, it } from '@jest/globals'
import type { JournalNode } from '@mycogni/contracts'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { JournalViewer } from '../editor/journal-viewer'

const body: JournalNode = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Domingo' }] },
    { type: 'image', attrs: { path: 'u/e/one.webp', width: 800, height: 1000, caption: 'Praia' } },
    { type: 'image', attrs: { path: 'u/e/two.webp', width: 800, height: 1000 } },
    { type: 'paragraph', content: [{ type: 'text', text: 'Depois' }] },
    { type: 'image', attrs: { path: 'u/e/three.webp', width: 1200, height: 800, caption: 'Mar' } },
  ],
}

const urls = {
  'u/e/one.webp': 'https://storage.local/one.webp',
  'u/e/two.webp': 'https://storage.local/two.webp',
  'u/e/three.webp': 'https://storage.local/three.webp',
}

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement('span').getClientRects()
  Range.prototype.getBoundingClientRect = () =>
    document.createElement('span').getBoundingClientRect()
})

describe('photo galleries', () => {
  it('shows a run of photos as a labelled gallery and a lone photo as one tile', async () => {
    renderWithIntl(<JournalViewer body={body} imageUrls={urls} />)

    const gallery = await screen.findByRole('region', { name: 'Galeria com 2 fotos' })
    expect(
      within(gallery)
        .getAllByRole('button')
        .map((tile) => tile.getAttribute('aria-label')),
    ).toEqual(['Foto 1 de 3: Praia', 'Foto 2 de 3'])
    expect(screen.getAllByRole('region')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Foto 3 de 3: Mar' })).toHaveStyle({
      aspectRatio: '1.5',
    })
  })

  it('opens the page photos in a viewer that only shows them to a professional', async () => {
    renderWithIntl(<JournalViewer body={body} imageUrls={urls} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Foto 2 de 3' }))

    const viewer = screen.getByRole('dialog', { name: 'Foto 2 de 3' })
    expect(within(viewer).queryByRole('button', { name: 'Baixar' })).not.toBeInTheDocument()
    expect(within(viewer).queryByRole('button', { name: 'Apagar' })).not.toBeInTheDocument()
    await userEvent.keyboard('{ArrowRight}')
    expect(within(viewer).getByText('Mar')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
