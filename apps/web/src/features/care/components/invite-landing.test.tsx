import { describe, expect, it } from '@jest/globals'
import type { InvitationPreview } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { ClosedInvite, PendingInvite, SignedOutChoices, UnknownInvite } from './invite-landing'

const preview: InvitationPreview = {
  professional: { name: 'Helena Prado', kind: 'psychologist', photoUrl: null },
  status: 'pending',
  expiresAt: '2026-10-17T12:00:00.000Z',
}

describe('invite landing', () => {
  it('tells a visitor who invites, what is shared and how to answer', () => {
    renderWithIntl(
      <PendingInvite preview={preview} now={new Date('2026-10-16T08:00:00.000Z')}>
        <SignedOutChoices code="K7M2X9QA" />
      </PendingInvite>,
    )

    expect(screen.getByText('Convite · Psicologia')).toBeInTheDocument()
    expect(screen.getByText('HP')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Helena Prado quer acompanhar seus registros.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'O que Helena Prado vai ver' })).toHaveTextContent(
      'Seus resultados do PHQ-9 e do GAD-7',
    )
    expect(screen.getByText('O convite vale por mais 1 dia.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar conta para responder' })).toHaveAttribute(
      'href',
      '/continue?to=%2Finvite%2FK7M2X9QA&via=sign-up',
    )
    expect(screen.getByRole('link', { name: 'Já tenho conta' })).toHaveAttribute(
      'href',
      '/continue?to=%2Finvite%2FK7M2X9QA&via=sign-in',
    )
  })

  it('shows the photo of the professional who invites', () => {
    renderWithIntl(
      <PendingInvite
        preview={{
          ...preview,
          professional: { ...preview.professional, photoUrl: 'https://exemplo.com/helena.jpg' },
        }}
        now={new Date('2026-10-16T08:00:00.000Z')}
      >
        <SignedOutChoices code="K7M2X9QA" />
      </PendingInvite>,
    )

    expect(screen.getByRole('img', { name: 'Foto de Helena Prado' })).toHaveAttribute(
      'src',
      'https://exemplo.com/helena.jpg',
    )
  })

  it('counts the last hours in English', () => {
    renderWithIntl(
      <PendingInvite preview={preview} now={new Date('2026-10-17T07:30:00.000Z')}>
        <SignedOutChoices code="K7M2X9QA" />
      </PendingInvite>,
      { locale: 'en-US' },
    )

    expect(screen.getByText('This invitation is valid for 5 more hours.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'I already have an account' })).toBeInTheDocument()
  })

  it('explains an expired invitation in European Portuguese', () => {
    renderWithIntl(<ClosedInvite status="expired" name="Helena Prado" signedIn />, {
      locale: 'pt-PT',
    })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Este convite expirou.' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/peça um novo convite a Helena Prado/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para o MyCogniAI' })).toHaveAttribute(
      'href',
      '/today',
    )
  })

  it('says when the code leads nowhere', () => {
    renderWithIntl(<UnknownInvite signedIn={false} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Não encontramos este convite.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conhecer o MyCogniAI' })).toHaveAttribute('href', '/')
  })
})
