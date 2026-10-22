import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { OnboardingStep } from '../onboarding'
import { professionalProfile, registrationDocument, testTimeZone } from '../test-data'
import { OnboardingScreen } from './onboarding-screen'

function renderScreen(step: OnboardingStep, professional = professionalProfile()) {
  const actions = {
    refresh: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    finishPhotoStep: jest
      .fn<() => Promise<ActionResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
  }
  renderWithIntl(
    <OnboardingScreen
      professional={professional}
      step={step}
      timeZone={testTimeZone}
      photoUrl={null}
      actions={actions}
    />,
  )
  return { actions, user: userEvent.setup({ applyAccept: false }) }
}

function title(): HTMLElement {
  return screen.getByRole('heading', { level: 1 })
}

describe('OnboardingScreen', () => {
  it('starts with one focused task: the registration document', async () => {
    const { user } = renderScreen('document')

    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument()
    expect(title()).toHaveTextContent('Envie o comprovante do seu registro.')
    expect(screen.getByRole('heading', { name: 'Carteira do CRP' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar comprovante' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Adicionar foto')).not.toBeInTheDocument()

    await user.upload(
      screen.getByLabelText('Escolher arquivo'),
      new File(['%PDF'], 'Carteira CRP.pdf', { type: 'application/pdf' }),
    )

    expect(screen.getByText('Carteira CRP.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar comprovante' })).toBeEnabled()
  })

  it('shows the note of the team and asks a rejected professional for a new document', () => {
    renderScreen(
      'document',
      professionalProfile({
        status: 'rejected',
        reviewNote: 'O número do registro não aparece.',
        document: registrationDocument(),
      }),
    )

    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument()
    expect(title()).toHaveTextContent('Não conseguimos verificar seu cadastro.')
    expect(screen.getByText('O número do registro não aparece.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'no-reply@mycogniapp.com' })).toHaveAttribute(
      'href',
      'mailto:no-reply@mycogniapp.com',
    )
    expect(screen.getByLabelText('Escolher arquivo')).toBeInTheDocument()
  })

  it('requires a photo of the face once the document arrived', () => {
    const { actions } = renderScreen(
      'photo',
      professionalProfile({ document: registrationDocument() }),
    )

    expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument()
    expect(title()).toHaveTextContent('Adicione uma foto do seu rosto.')
    expect(screen.getByText(/A foto é obrigatória/)).toBeInTheDocument()
    expect(screen.getByText('Comprovante recebido. A análise já começou.')).toBeInTheDocument()
    expect(screen.getByText('Psicologia')).toBeInTheDocument()
    expect(screen.getByLabelText('Adicionar foto')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular por agora' })).not.toBeInTheDocument()
    expect(actions.finishPhotoStep).not.toHaveBeenCalled()
  })

  it('ends with the review: the document on file, its status and what comes next', () => {
    renderScreen(
      'review',
      professionalProfile({ document: registrationDocument({ fileName: 'crp-frente.pdf' }) }),
    )

    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument()
    expect(title()).toHaveTextContent('Seu cadastro está em verificação.')
    expect(screen.getByText('crp-frente.pdf')).toBeInTheDocument()
    expect(screen.getAllByText('Em análise')).toHaveLength(2)
    expect(
      screen.getByText('Conferimos seu nome, seu registro, sua foto e o comprovante enviado.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/pro/settings',
    )
    expect(screen.queryByLabelText('Escolher arquivo')).not.toBeInTheDocument()
  })
})
