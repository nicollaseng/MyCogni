import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { OnboardingSteps } from './onboarding-steps'

function steps() {
  return within(screen.getByRole('list', { name: 'Cadastro profissional' })).getAllByRole(
    'listitem',
  )
}

describe('OnboardingSteps', () => {
  it('lists the three steps and marks the current one', () => {
    renderWithIntl(<OnboardingSteps current="document" kind="psychologist" />)

    const [document, photo, review] = steps()
    expect(document).toHaveAttribute('aria-current', 'step')
    expect(document).toHaveTextContent('Comprovante')
    expect(document).toHaveTextContent('Carteira do CRP')
    expect(photo).not.toHaveAttribute('aria-current')
    expect(photo).toHaveTextContent('Opcional. Aparece para seus pacientes.')
    expect(review).toHaveTextContent('Em análise')
  })

  it('says which steps are already done', () => {
    renderWithIntl(<OnboardingSteps current="review" kind="psychoanalyst" />)

    const [document, photo, review] = steps()
    expect(document).toHaveTextContent('Comprovante, concluído')
    expect(document).toHaveTextContent('Comprovante de formação')
    expect(photo).toHaveTextContent('Foto do perfil, concluído')
    expect(review).toHaveAttribute('aria-current', 'step')
    expect(review).not.toHaveTextContent('concluído')
  })

  it('speaks European Portuguese too', () => {
    renderWithIntl(<OnboardingSteps current="photo" kind="psychiatrist" />, { locale: 'pt-PT' })

    expect(screen.getByRole('list', { name: 'Registo profissional' })).toBeInTheDocument()
    expect(screen.getByText('Fotografia de perfil')).toBeInTheDocument()
  })
})
