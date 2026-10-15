import { describe, expect, it, jest } from '@jest/globals'
import type { CheckInAddendum, CheckInDetail } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { EntryAddenda } from './entry-addenda'
import { EntryDetail } from './entry-detail'

const timeZone = 'America/Sao_Paulo'

const record: CheckInDetail = {
  id: '0b7c6c8e-6a8f-4f53-9f4b-000000000021',
  moodLevel: 2,
  emotions: ['anxiety', 'luto'],
  contexts: ['work'],
  note: 'Prazo apertado no trabalho.',
  recordedAt: '2026-10-14T12:05:00Z',
  addenda: [
    {
      id: '0b7c6c8e-6a8f-4f53-9f4b-000000000031',
      text: 'O prazo foi cumprido.',
      createdAt: '2026-10-15T13:30:00Z',
    },
  ],
}

type Append = jest.Mock<(text: string) => Promise<ActionResult<CheckInAddendum>>>

function renderDetail(append?: Append, detail: CheckInDetail = record) {
  const user = userEvent.setup()
  const view = renderWithIntl(
    <EntryDetail
      checkIn={detail}
      timeZone={timeZone}
      back={{ href: '/entries', label: 'Registros' }}
    >
      <EntryAddenda addenda={detail.addenda} timeZone={timeZone} append={append} />
    </EntryDetail>,
  )
  return { user, ...view }
}

describe('EntryDetail', () => {
  it('shows the mood symbol, the moment, emotions, contexts and the note', () => {
    const { container } = renderDetail()

    expect(screen.getByRole('link', { name: 'Registros' })).toHaveAttribute('href', '/entries')
    expect(screen.getByRole('heading', { level: 1, name: 'Um pouco mal' })).toBeVisible()
    expect(screen.getByText(/Quarta-feira, 14 de outubro · 09:05/)).toBeVisible()
    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(5)
    expect(
      within(screen.getByRole('list', { name: 'Emoções' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['ansiedade', '·luto'])
    expect(screen.getByRole('list', { name: 'Contextos' })).toHaveTextContent('trabalho')
    expect(screen.getByText('Prazo apertado no trabalho.')).toBeVisible()
  })

  it('leaves out what was not marked', () => {
    renderDetail(undefined, { ...record, emotions: [], contexts: [], note: null, addenda: [] })

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('Nota')).not.toBeInTheDocument()
    expect(screen.queryByText('Escrito depois')).not.toBeInTheDocument()
  })

  it('is read only without a way to append, as professionals see it', () => {
    renderDetail()

    expect(screen.getByRole('region', { name: 'Escrito depois' })).toHaveTextContent(
      '15 de outubro · 10:30O prazo foi cumprido.',
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('appends a new note below the earlier ones and never edits the record', async () => {
    const append: Append = jest.fn(() =>
      Promise.resolve({
        ok: true,
        value: {
          id: '0b7c6c8e-6a8f-4f53-9f4b-000000000032',
          text: 'Dormi bem depois.',
          createdAt: '2026-10-16T01:00:00Z',
        },
      }),
    )
    const { user } = renderDetail(append)

    await user.click(screen.getByRole('button', { name: 'Escrever mais' }))
    const field = screen.getByRole('textbox', { name: 'O que você quer acrescentar?' })
    expect(field).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    await user.type(field, 'Dormi bem depois.')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(append).toHaveBeenCalledWith('Dormi bem depois.')
    const items = within(screen.getByRole('region', { name: 'Escrito depois' })).getAllByRole(
      'listitem',
    )
    expect(items.map((item) => item.textContent)).toEqual([
      '15 de outubro · 10:30O prazo foi cumprido.',
      '15 de outubro · 22:00Dormi bem depois.',
    ])
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Prazo apertado no trabalho.')).toBeVisible()
  })

  it('keeps the text and says so when saving fails, and lets the person give up', async () => {
    const append: Append = jest.fn(() =>
      Promise.resolve({ ok: false, error: 'Não foi possível guardar. Tente de novo.' }),
    )
    const { user } = renderDetail(append)

    await user.click(screen.getByRole('button', { name: 'Escrever mais' }))
    await user.type(screen.getByRole('textbox'), 'Rascunho')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível guardar.')
    expect(screen.getByRole('textbox')).toHaveValue('Rascunho')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('counts the characters left near the limit', async () => {
    const append: Append = jest.fn()
    const { user } = renderDetail(append)

    await user.click(screen.getByRole('button', { name: 'Escrever mais' }))
    await user.click(screen.getByRole('textbox'))
    await user.paste('a'.repeat(950))

    expect(screen.getByText('50 caracteres restantes')).toBeVisible()
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '1000')
  })

  it('speaks English', () => {
    const append: Append = jest.fn()
    renderWithIntl(
      <EntryDetail
        checkIn={record}
        timeZone={timeZone}
        back={{ href: '/entries', label: 'Entries' }}
      >
        <EntryAddenda addenda={[]} timeZone={timeZone} append={append} />
      </EntryDetail>,
      { locale: 'en-US' },
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Slightly bad' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Write more' })).toBeVisible()
  })
})
