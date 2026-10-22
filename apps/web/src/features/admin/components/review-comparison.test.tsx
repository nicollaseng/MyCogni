import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { reviewDetail } from '../review-test-data'
import { ReviewComparison } from './review-comparison'
import { ReviewHistory } from './review-history'

describe('ReviewComparison', () => {
  it('puts the photo next to the document so the team can compare faces', () => {
    renderWithIntl(<ReviewComparison professional={reviewDetail()} timeZone="America/Sao_Paulo" />)

    expect(screen.getByRole('img', { name: 'Foto de Helena Prado' })).toHaveAttribute(
      'src',
      'https://exemplo.com/helena.jpg',
    )
    expect(
      screen.getByRole('link', { name: 'Abrir comprovante de Helena Prado em nova aba' }),
    ).toHaveAttribute('href', '/admin/documents/0b7c6c8e-6a8f-4f53-9f4b-000000000041')
    expect(screen.getByText('Abrir documento')).toBeInTheDocument()
    expect(screen.getByText('CRP 06/123456')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Consultar no CFP' })).toHaveAttribute(
      'href',
      'https://cadastro.cfp.org.br/',
    )
  })

  it('says what is missing and flags a registration kept from free text', () => {
    renderWithIntl(
      <ReviewComparison
        professional={reviewDetail({
          photoUrl: null,
          hasPhoto: false,
          document: null,
          registration: 'CRP 10/1234',
          registrationNeedsReview: true,
        })}
        timeZone="America/Sao_Paulo"
      />,
    )

    expect(
      screen.getByText('Sem foto. Sem ela não dá para comparar o rosto com o documento.'),
    ).toBeInTheDocument()
    expect(screen.getByText('O profissional ainda não enviou o comprovante.')).toBeInTheDocument()
    expect(screen.getByText(/Registro em texto livre/)).toBeInTheDocument()
  })
})

describe('ReviewHistory', () => {
  it('lists each decision with who made it', () => {
    renderWithIntl(
      <ReviewHistory
        history={[
          {
            id: '0b7c6c8e-6a8f-4f53-9f4b-000000000051',
            decision: 'rejected',
            note: 'Documento ilegível.',
            adminEmail: 'equipe@exemplo.com',
            createdAt: '2026-10-16T13:00:00Z',
          },
          {
            id: '0b7c6c8e-6a8f-4f53-9f4b-000000000052',
            decision: 'verified',
            note: null,
            adminEmail: null,
            createdAt: '2026-10-15T13:00:00Z',
          },
        ]}
        timeZone="America/Sao_Paulo"
      />,
    )

    const [, rejected, verified] = screen.getAllByRole('row')
    expect(rejected).toHaveTextContent('Recusado')
    expect(rejected).toHaveTextContent('Documento ilegível.')
    expect(rejected).toHaveTextContent('equipe@exemplo.com')
    expect(verified).toHaveTextContent('Aprovado')
    expect(verified).toHaveTextContent('Conta removida')
  })

  it('says when there is no decision yet', () => {
    renderWithIntl(<ReviewHistory history={[]} timeZone="America/Sao_Paulo" />)

    expect(screen.getByText('Nenhuma decisão registrada ainda.')).toBeInTheDocument()
  })
})
