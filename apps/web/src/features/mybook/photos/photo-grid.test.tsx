import { describe, expect, it, jest } from '@jest/globals'
import type { JournalPhoto, JournalPhotoPage } from '@mycogni/contracts'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SafetyPrompt } from '@/features/safety/model'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
import { BookViews } from '../components/book-views'
import type { PhotoChange } from './model'
import { PhotoGrid } from './photo-grid'

type Load = (offset: number) => Promise<ActionResult<JournalPhotoPage>>

type Change = (
  entryId: string,
  path: string,
  change: PhotoChange,
) => Promise<ActionResult<SafetyPrompt | null>>

const beach = '8a7d3c1e-0000-4000-8000-000000000001'

const park = '8a7d3c1e-0000-4000-8000-000000000002'

function photo(overrides: Partial<JournalPhoto>): JournalPhoto {
  return {
    entryId: beach,
    entryTitle: 'Praia',
    writtenAt: '2026-10-19T15:00:00.000Z',
    position: 1,
    path: 'u/beach/one.jpg',
    url: 'https://storage.local/one.jpg',
    caption: '',
    width: 800,
    height: 1000,
    ...overrides,
  }
}

const first: JournalPhotoPage = {
  photos: [
    photo({ caption: 'Areia' }),
    photo({ path: 'u/beach/two.jpg', position: 2 }),
    photo({
      entryId: park,
      entryTitle: null,
      writtenAt: '2026-09-02T15:00:00.000Z',
      path: 'u/park/one.jpg',
    }),
  ],
  nextOffset: 3,
}

function renderGrid(initial: JournalPhotoPage = first) {
  const load = jest.fn<Load>(() =>
    Promise.resolve({
      ok: true,
      value: {
        photos: [
          photo({ entryId: park, writtenAt: '2026-09-01T15:00:00.000Z', path: 'u/park/two.jpg' }),
        ],
        nextOffset: null,
      },
    }),
  )
  const change = jest.fn<Change>(() => Promise.resolve({ ok: true, value: null }))
  const router = fakeRouter()
  renderWithIntl(
    <WithRouter router={router}>
      <PhotoGrid initial={initial} timeZone="America/Sao_Paulo" load={load} change={change} />
    </WithRouter>,
  )
  return { load, change, router }
}

function grid() {
  return screen.getByRole('region', { name: 'Fotos do MyBook' })
}

describe('PhotoGrid', () => {
  it('shows the photos by month, labelled by caption or date', () => {
    renderGrid()

    expect(
      within(grid())
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['Outubro', 'Setembro'])
    expect(
      within(grid())
        .getAllByRole('button')
        .map((tile) => tile.getAttribute('aria-label')),
    ).toEqual(['Areia', 'Foto de 19 de out.', 'Foto de 2 de set.'])
  })

  it('loads the next batch on demand and stops when there is nothing more', async () => {
    const { load } = renderGrid()

    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))

    expect(load).toHaveBeenCalledWith(3)
    expect(within(grid()).getAllByRole('button')).toHaveLength(4)
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('says calmly where photos will appear when there are none', () => {
    renderGrid({ photos: [], nextOffset: null })

    expect(
      screen.getByText('As fotos que você colocar nas páginas aparecem aqui.'),
    ).toBeInTheDocument()
  })

  it('opens every photo of the grid in the viewer with its day and page', async () => {
    renderGrid()

    await userEvent.click(screen.getByRole('button', { name: 'Foto de 19 de out.' }))
    const viewer = screen.getByRole('dialog', { name: 'Foto 2 de 3' })
    expect(within(viewer).getByText('19 de out. · Praia')).toBeInTheDocument()

    await userEvent.keyboard('{ArrowRight}')
    expect(within(viewer).getByText('2 de set. · Sem título')).toBeInTheDocument()
  })

  it('saves a caption and deletes a photo on its page', async () => {
    const { change } = renderGrid()

    await userEvent.click(screen.getByRole('button', { name: 'Foto de 19 de out.' }))
    await userEvent.click(screen.getByRole('button', { name: 'Editar legenda' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Legenda' }), 'Ondas')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(change).toHaveBeenCalledWith(beach, 'u/beach/two.jpg', {
      kind: 'caption',
      caption: 'Ondas',
    })
    await waitFor(() => {
      expect(within(grid()).getByRole('button', { name: 'Ondas' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Apagar' }),
    )

    expect(change).toHaveBeenLastCalledWith(beach, 'u/beach/two.jpg', { kind: 'remove' })
    await waitFor(() => {
      expect(within(grid()).getAllByRole('button')).toHaveLength(2)
    })
  })

  it('opens the page of a photo at that photo', async () => {
    const { router } = renderGrid()

    await userEvent.click(screen.getByRole('button', { name: 'Areia' }))
    await userEvent.click(screen.getByRole('button', { name: 'Abrir página' }))

    expect(router.push).toHaveBeenCalledWith(`/mybook/${beach}#photo=u%2Fbeach%2Fone.jpg`)
  })
})

describe('BookViews', () => {
  it('switches between pages and photos', () => {
    renderWithIntl(<BookViews current="photos" />)

    const views = screen.getByRole('navigation', { name: 'Ver o MyBook por' })
    expect(within(views).getByRole('link', { name: 'Fotos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(views).getByRole('link', { name: 'Páginas' })).toHaveAttribute('href', '/mybook')
  })
})
