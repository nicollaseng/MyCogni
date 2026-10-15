import { describe, expect, it, jest } from '@jest/globals'
import type { CareLink } from '@mycogni/contracts'
import { sharingConsentVersion } from '@mycogni/domain'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { CareLinks } from './care-links'

type End = (id: string) => Promise<ActionResult<null>>

const links: CareLink[] = [
  {
    id: '3e2d1c0b-0000-4000-8000-000000000001',
    professional: {
      name: 'Helena Prado',
      kind: 'psychologist',
      registration: 'CRP 06/123456',
      photoUrl: 'https://exemplo.com/helena.jpg',
    },
    sharesHistory: false,
    startedAt: '2026-10-14T15:00:00.000Z',
    consentVersion: sharingConsentVersion,
    termsOutdated: false,
  },
  {
    id: '3e2d1c0b-0000-4000-8000-000000000002',
    professional: {
      name: 'Lúcia Mendes',
      kind: 'psychiatrist',
      registration: 'CRM 123456',
      photoUrl: null,
    },
    sharesHistory: true,
    startedAt: '2026-09-01T15:00:00.000Z',
    consentVersion: '2026-10',
    termsOutdated: true,
  },
]

function succeed(): Promise<ActionResult<null>> {
  return Promise.resolve({ ok: true, value: null })
}

function row(name: string): HTMLElement {
  const found = screen
    .getAllByRole('listitem')
    .find((item) => within(item).queryByText(name) !== null)
  if (found === undefined) {
    throw new Error(`No row for ${name}`)
  }
  return found
}

describe('CareLinks', () => {
  it('lists who follows the records, since when and whether the history is shared', () => {
    renderWithIntl(
      <CareLinks links={links} timeZone="America/Sao_Paulo" end={succeed} isProfessional />,
    )

    expect(row('Helena Prado')).toHaveTextContent(
      'Psicologia · Desde 14 de outubroSó registros a partir do vínculo',
    )
    expect(row('Lúcia Mendes')).toHaveTextContent('Inclui registros anteriores')
    expect(
      within(row('Helena Prado')).getByRole('img', { name: 'Foto de Helena Prado' }),
    ).toHaveAttribute('src', 'https://exemplo.com/helena.jpg')
    expect(within(row('Lúcia Mendes')).getByText('LM')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver convites' })).toHaveAttribute('href', '/invites')
    expect(screen.getByRole('link', { name: 'Área profissional' })).toHaveAttribute('href', '/pro')
  })

  it('points to the new terms only on the links that still wait for them', () => {
    renderWithIntl(
      <CareLinks links={links} timeZone="America/Sao_Paulo" end={succeed} isProfessional={false} />,
    )

    expect(
      within(row('Lúcia Mendes')).getByRole('link', { name: 'Confirme os novos termos' }),
    ).toHaveAttribute('href', '/me/professionals/3e2d1c0b-0000-4000-8000-000000000002/terms')
    expect(
      within(row('Helena Prado')).queryByRole('link', { name: 'Confirme os novos termos' }),
    ).not.toBeInTheDocument()
  })

  it('asks for confirmation before ending a link', async () => {
    const end = jest.fn<End>(succeed)
    renderWithIntl(
      <CareLinks links={links} timeZone="America/Sao_Paulo" end={end} isProfessional={false} />,
    )
    const helena = within(row('Helena Prado'))

    await userEvent.click(helena.getByRole('button', { name: 'Encerrar vínculo' }))
    expect(helena.getByText(/Helena Prado deixa de ver seus registros/)).toBeInTheDocument()
    expect(end).not.toHaveBeenCalled()

    await userEvent.click(helena.getByRole('button', { name: 'Cancelar' }))
    expect(helena.queryByText(/deixa de ver seus registros/)).not.toBeInTheDocument()

    await userEvent.click(helena.getByRole('button', { name: 'Encerrar vínculo' }))
    await userEvent.click(helena.getByRole('button', { name: 'Encerrar vínculo' }))
    expect(end).toHaveBeenCalledWith('3e2d1c0b-0000-4000-8000-000000000001')
    expect(screen.queryByRole('link', { name: 'Área profissional' })).not.toBeInTheDocument()
  })

  it('says when the link could not be ended', async () => {
    renderWithIntl(
      <CareLinks
        links={links}
        timeZone="America/Sao_Paulo"
        end={() => Promise.resolve({ ok: false, error: 'Não conseguimos encerrar o vínculo.' })}
        isProfessional={false}
      />,
    )
    const helena = within(row('Helena Prado'))

    await userEvent.click(helena.getByRole('button', { name: 'Encerrar vínculo' }))
    await userEvent.click(helena.getByRole('button', { name: 'Encerrar vínculo' }))

    expect(await helena.findByRole('alert')).toHaveTextContent(
      'Não conseguimos encerrar o vínculo.',
    )
  })

  it('says when nobody follows the records', () => {
    renderWithIntl(
      <CareLinks links={[]} timeZone="America/Sao_Paulo" end={succeed} isProfessional={false} />,
    )

    expect(screen.getByText('Nenhum profissional acompanha seus registros.')).toBeInTheDocument()
  })
})
