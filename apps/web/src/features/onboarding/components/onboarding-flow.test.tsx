import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { instrumentText, type Locale } from '@mycogni/domain'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RenderPhoto } from '@/features/account/photo-canvas'
import type { UploadResult } from '@/shared/lib/uploads'
import { renderWithIntl } from '@/test/render'
import type { OnboardingStart } from '../model'
import type { Assessment } from '@mycogni/contracts'
import { assessmentOf, fakeActions, fakeSubmit } from '../test/fixtures'
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

const userId = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'

function startAt(
  step: OnboardingStart['step'],
  results: OnboardingStart['results'] = {},
  assessments: readonly Assessment[] = [],
): OnboardingStart {
  return { step, userId, displayName: 'Ana', results, assessments }
}

async function answer(choices: readonly string[], total: number, from = 1) {
  for (const [offset, choice] of choices.entries()) {
    await screen.findByText(`Pergunta ${String(from + offset)} de ${String(total)}`)
    await userEvent.click(screen.getByRole('button', { name: choice }))
  }
}

afterEach(() => {
  window.localStorage.clear()
})

describe('OnboardingFlow', () => {
  it('goes from the name to the first question', async () => {
    const actions = renderFlow(startAt('name'))

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(actions.saveName).toHaveBeenCalledWith({
      displayName: 'Ana',
      timezone: expect.any(String),
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar sem foto' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Começar' }))

    expect(
      await screen.findByRole('heading', { name: instrumentText('pt-BR', 'phq9').items[0] }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nas últimas 2 semanas')).toBeInTheDocument()
    expect(screen.getByText('Pergunta 1 de 5')).toBeInTheDocument()
  })

  it('offers an optional photo after the name, cropped before it is sent', async () => {
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = jest.fn()
    const transport = photoTransport()
    const actions = renderFlow(
      { ...startAt('name'), displayName: 'Ana Lima' },
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

  it('ends after five questions when nothing calls for more and saves the short answers', async () => {
    const submit = fakeSubmit()
    renderFlow(startAt('screening'), fakeActions({ submitScreening: submit }))

    await answer(['Nenhuma vez', 'Vários dias', 'Vários dias', 'Nenhuma vez', 'Nenhuma vez'], 5)

    expect(
      await screen.findByRole('heading', { name: 'Seu ponto de partida.' }),
    ).toBeInTheDocument()
    expect(submit.mock.calls.map(([input]) => input)).toEqual([
      { instrument: 'gad2', answers: [1, 0] },
      { instrument: 'phq2', answers: [0, 1, 0] },
    ])
    expect(screen.getByRole('region', { name: 'Desânimo' })).toHaveTextContent('DesânimoBaixo')
    expect(screen.queryByText(/PHQ|GAD|de 6/)).not.toBeInTheDocument()
  })

  it('stops for support when the safety question is above zero on a calm screen', async () => {
    renderFlow(startAt('screening'))

    await answer(['Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Vários dias'], 5)

    expect(await screen.findByRole('heading', { name: 'Obrigado por contar.' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar o questionário' }))
    expect(
      await screen.findByRole('heading', { name: 'Seu ponto de partida.' }),
    ).toBeInTheDocument()
  })

  it('announces more mood questions when the mood screen is positive and keeps the count honest', async () => {
    const submit = fakeSubmit()
    renderFlow(startAt('screening'), fakeActions({ submitScreening: submit }))

    await answer(['Mais da metade dos dias', 'Vários dias', 'Nenhuma vez', 'Nenhuma vez'], 5)

    expect(
      await screen.findByRole('heading', { name: 'Mais algumas perguntas sobre ânimo' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Mais 7 perguntas, uma por tela/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await answer(
      Array.from({ length: 7 }, () => 'Nenhuma vez'),
      11,
      5,
    )

    expect(
      await screen.findByRole('heading', { name: 'Seu ponto de partida.' }),
    ).toBeInTheDocument()
    expect(submit.mock.calls.map(([input]) => input.instrument)).toEqual(['gad2', 'phq9'])
    expect(submit.mock.calls[1]?.[0].answers).toEqual([2, 1, 0, 0, 0, 0, 0, 0, 0])
  })

  it('picks up at the next unanswered question after a pause', async () => {
    renderFlow(startAt('screening'))
    await answer(['Nenhuma vez', 'Vários dias', 'Nenhuma vez'], 5)
    await screen.findByText('Pergunta 4 de 5')
    cleanup()

    renderFlow(startAt('name'))

    expect(await screen.findByText('Pergunta 4 de 5')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('Pergunta 3 de 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nenhuma vez' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('resumes on the results with what was already answered', () => {
    renderFlow(
      startAt('results', {
        depression: assessmentOf(),
        anxiety: assessmentOf({
          instrument: 'gad7',
          totalScore: 6,
          maxScore: 21,
          severity: 'mild',
        }),
      }),
    )

    expect(screen.getByRole('region', { name: 'Ansiedade' })).toHaveTextContent('AnsiedadeLeve')
    expect(screen.getByText('Etapa 4 de 4')).toBeInTheDocument()
  })

  it('guides an English speaker from the name and the photo to the questionnaires', async () => {
    renderFlow(startAt('name'), fakeActions(), 'en-US')

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
    expect(screen.getByText('questions to start, one per screen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })
})
