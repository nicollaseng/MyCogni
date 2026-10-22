import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { reviewDetail } from '../review-test-data'
import { ProfessionalReviewList } from './professional-review-list'

const helena = reviewDetail()

const rafael = reviewDetail({
  userId: '0b7c6c8e-6a8f-4f53-9f4b-000000000032',
  kind: 'psychoanalyst',
  fullName: 'Rafael Lima',
  registration: null,
  council: null,
  email: 'rafael@exemplo.com',
  hasPhoto: false,
  document: null,
})

const caio = reviewDetail({
  userId: '0b7c6c8e-6a8f-4f53-9f4b-000000000033',
  fullName: 'Caio Reis',
  registration: 'CRP 10/1234',
  registrationNeedsReview: true,
  status: 'verified',
  verifiedAt: '2025-09-01T12:00:00Z',
})

describe('ProfessionalReviewList', () => {
  it('shows what the team needs before opening each review', () => {
    renderWithIntl(
      <ProfessionalReviewList
        professionals={[helena, rafael]}
        view="pending"
        timeZone="America/Sao_Paulo"
      />,
    )

    const first = within(screen.getByRole('row', { name: 'Helena Prado' }))
    expect(first.getByText('Psicologia')).toBeInTheDocument()
    expect(first.getByText('CRP 06/123456')).toBeInTheDocument()
    expect(first.getByText('helena@exemplo.com')).toBeInTheDocument()
    expect(first.getByText('Enviada')).toBeInTheDocument()
    expect(first.getByText('PDF')).toBeInTheDocument()
    expect(first.getByText('Cadastro em 14 de out. de 2026')).toBeInTheDocument()
    expect(first.getByRole('link', { name: 'Revisar cadastro de Helena Prado' })).toHaveAttribute(
      'href',
      `/admin/professionals/${helena.userId}`,
    )

    const second = within(screen.getByRole('row', { name: 'Rafael Lima' }))
    expect(second.getByText('Psicanálise')).toBeInTheDocument()
    expect(second.getByText('Sem registro')).toBeInTheDocument()
    expect(second.getByText('Falta foto')).toBeInTheDocument()
    expect(second.getByText('Aguardando envio')).toBeInTheDocument()
  })

  it('shows when a professional was verified and flags a registration to review', () => {
    renderWithIntl(
      <ProfessionalReviewList
        professionals={[caio]}
        view="revalidate"
        timeZone="America/Sao_Paulo"
      />,
    )

    const row = within(screen.getByRole('row', { name: 'Caio Reis' }))
    expect(row.getByText('Verificado em 1 de set. de 2025')).toBeInTheDocument()
    expect(row.getByText('Precisa revisar')).toBeInTheDocument()
  })

  it('says when there is nobody to review in each view', () => {
    renderWithIntl(
      <ProfessionalReviewList professionals={[]} view="revalidate" timeZone="America/Sao_Paulo" />,
    )

    expect(screen.getByText('Nenhuma verificação com mais de 12 meses.')).toBeInTheDocument()
  })
})
