import { describe, expect, it, jest } from '@jest/globals'
import { instrumentText, type Locale } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RenderPhoto } from '@/features/account/photo-canvas'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import type { OnboardingStart } from '../model'
import { assessmentOf, fakeActions } from '../test/fixtures'
import { OnboardingFlow } from './onboarding-flow'

const signOut = jest.fn(() => Promise.resolve())

const rendered = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' })

function photoTransport() {
  return {
    send: jest
      .fn<(photo: File) => Promise<UploadResult<string | null>>>()
      .mockResolvedValue({ ok: true, value: 'https://exemplo.com/ana.jpg' }),
    remove: jest
      .fn<() => Promise<UploadResult<null>>>()
      .mockResolvedValue({ ok: true, value: null }),
    render: jest.fn<RenderPhoto>().mockResolvedValue(rendered),
  }
}

function renderFlow(
  start: OnboardingStart,
  actions = fakeActions(),
  locale: Locale = 'pt-BR',
  transport = photoTransport(),
) {
  renderWithIntl(
    <OnboardingFlow
      start={start}
      actions={actions}
      photo={{ url: null, email: 'ana@exemplo.com' }}
      photoTransport={transport}
      signOut={signOut}
    />,
    { locale },
  )
  return actions
}

async function answerAll(total: number, name: string, last = 'Nenhuma vez') {
  for (let index = 1; index <= total; index++) {
    await screen.findByText(`${name} · ${String(index)} de ${String(total)}`)
    await userEvent.click(
      screen.getByRole('button', { name: index === total ? last : 'Nenhuma vez' }),
    )
  }
}

describe('OnboardingFlow', () => {
  it('goes from the name to the first question', async () => {
    const actions = renderFlow({ step: 'name', displayName: 'Ana', results: {} })

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(actions.saveName).toHaveBeenCalledWith({
      displayName: 'Ana',
      timezone: expect.any(String),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar sem foto' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Começar' }))

    expect(
      screen.getByRole('heading', { name: instrumentText('pt-BR', 'phq9').items[0] }),
    ).toBeInTheDocument()
  })

  it('offers an optional photo after the name, cropped before it is sent', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = jest.fn()
    const transport = photoTransport()
    const actions = renderFlow(
      { step: 'name', displayName: 'Ana Lima', results: {} },
      fakeActions(),
      'pt-BR',
      transport,
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(
      await screen.findByRole('heading', { name: 'Quer adicionar uma foto?' }),
    ).toBeInTheDocument()
    expect(screen.getByText('AL')).toBeInTheDocument()

    await user.upload(
      screen.getByLabelText('Adicionar foto'),
      new File(['png'], 'ana.png', { type: 'image/png' }),
    )
    await user.click(screen.getByRole('button', { name: 'Usar foto' }))

    expect(transport.send).toHaveBeenCalledWith(rendered)
    expect(await screen.findByRole('img', { name: 'Sua foto' })).toBeInTheDocument()
    expect(actions.photoSaved).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('button', { name: 'Começar' })).toBeInTheDocument()
  })

  it('stops for support when PHQ-9 item 9 is above zero, then moves on to GAD-7', async () => {
    renderFlow({ step: 'phq9', displayName: 'Ana', results: {} })

    await answerAll(9, 'PHQ-9', 'Vários dias')

    expect(await screen.findByRole('heading', { name: 'Obrigado por contar.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar para o CVV' })).toHaveAttribute(
      'href',
      'tel:188',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Continuar o questionário' }))

    expect(screen.getByText('GAD-7 · 1 de 7')).toBeInTheDocument()
  })

  it('goes straight to GAD-7 without the flag and ends on the results', async () => {
    renderFlow({ step: 'phq9', displayName: 'Ana', results: {} })

    await answerAll(9, 'PHQ-9')
    await answerAll(7, 'GAD-7')

    expect(
      await screen.findByRole('heading', { name: 'Seu ponto de partida.' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Obrigado por contar.')).not.toBeInTheDocument()
  })

  it('resumes on the results with what was already answered', () => {
    renderFlow({
      step: 'results',
      displayName: 'Ana',
      results: {
        phq9: assessmentOf(),
        gad7: assessmentOf({ instrument: 'gad7', totalScore: 6, maxScore: 21, severity: 'mild' }),
      },
    })

    expect(screen.getByRole('region', { name: 'Sinais de ansiedade' })).toHaveTextContent('6de 21')
    expect(screen.getByText('Etapa 4 de 4')).toBeInTheDocument()
  })

  it('guides an English speaker from the name and the photo to the questionnaires', async () => {
    renderFlow({ step: 'name', displayName: 'Ana', results: {} }, fakeActions(), 'en-US')

    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      await screen.findByRole('heading', { name: 'Would you like to add a photo?' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continue without a photo' }))

    expect(
      await screen.findByRole('heading', { name: 'Two short questionnaires' }),
    ).toBeInTheDocument()
    expect(screen.getByText('questions, one per screen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })
})
