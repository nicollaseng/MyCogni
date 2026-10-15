import { describe, expect, it, jest } from '@jest/globals'
import type { CareLink, CreateJournalShareInput } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { now, shareOf, summaryOf, timeZone } from '../test-data'
import { ProfessionalSharing, ShareStateLabel } from './professional-sharing'

type Revoke = (id: string) => Promise<ActionResult<null>>

const link: CareLink = {
  id: '3e2d1c0b-0000-4000-8000-000000000001',
  professional: { name: 'Helena Prado', kind: 'psychologist', registration: 'CRP 06/123456' },
  sharesHistory: false,
  startedAt: '2026-10-01T15:00:00.000Z',
}

function succeed(): Promise<ActionResult<null>> {
  return Promise.resolve({ ok: true, value: null })
}

const share: (input: CreateJournalShareInput) => Promise<ActionResult<null>> = succeed

describe('ShareStateLabel', () => {
  it.each([
    [{ kind: 'none' } as const, 'Nada compartilhado'],
    [{ kind: 'entries', count: 3 } as const, 'Páginas escolhidas (3)'],
    [
      { kind: 'all', until: new Date('2026-11-14T15:00:00.000Z') } as const,
      'MyBook inteiro até 14 de novembro',
    ],
    [{ kind: 'all', until: null } as const, 'MyBook inteiro sem prazo'],
  ])('describes what is shared', (state, label) => {
    renderWithIntl(<ShareStateLabel state={state} now={now} timeZone={timeZone} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('ProfessionalSharing', () => {
  const live = shareOf({ lastAccessAt: '2026-10-15T14:30:00.000Z' })
  const revoked = shareOf({
    id: '5b1e2f3a-0000-4000-8000-000000000002',
    scope: 'all',
    entryIds: [],
    expiresAt: null,
    revokedAt: '2026-10-10T12:00:00.000Z',
    createdAt: '2026-10-02T12:00:00.000Z',
  })

  function renderSharing(revoke: Revoke) {
    renderWithIntl(
      <ProfessionalSharing
        link={link}
        shares={[live, revoked]}
        access={{
          [live.id]: [
            {
              entryId: live.entryIds[0] ?? '',
              entryTitle: 'Um domingo mais leve',
              accessedAt: '2026-10-15T14:30:00.000Z',
            },
          ],
        }}
        pages={[summaryOf()]}
        preselected={[]}
        initiallyOpen={false}
        now={now}
        timeZone={timeZone}
        share={share}
        revoke={revoke}
      />,
    )
  }

  it('shows what is shared now, when it ends, what was read and the history', () => {
    renderSharing(succeed)

    expect(screen.getByRole('heading', { name: 'Helena Prado' })).toBeInTheDocument()
    expect(screen.getByText('Psicologia')).toBeInTheDocument()
    expect(screen.getByText('Páginas escolhidas (1)')).toBeInTheDocument()
    expect(screen.getByText('desde 15 de outubro · até 22 de outubro')).toBeInTheDocument()
    expect(
      screen.getByText('Abriu “Um domingo mais leve” em 15 de out., 11:30'),
    ).toBeInTheDocument()
    expect(screen.getByText('Histórico (1)')).toBeInTheDocument()
    expect(screen.getByText('encerrado em 10 de outubro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compartilhar mais' })).toBeInTheDocument()
  })

  it('asks for confirmation before ending a share', async () => {
    const revoke = jest.fn<Revoke>(succeed)
    renderSharing(revoke)

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar' }))
    expect(
      screen.getByText('Helena Prado deixa de ler o que você compartilhou aqui a partir de agora.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(revoke).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Encerrar compartilhamento' }))

    expect(revoke).toHaveBeenCalledWith(live.id)
  })

  it('explains when a share could not be ended', async () => {
    renderSharing(() => Promise.resolve({ ok: false, error: 'Não conseguimos encerrar agora.' }))

    await userEvent.click(screen.getByRole('button', { name: 'Encerrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Encerrar compartilhamento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos encerrar agora.')
  })
})
