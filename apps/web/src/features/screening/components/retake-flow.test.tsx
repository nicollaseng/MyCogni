import { afterEach, describe, expect, it } from '@jest/globals'
import type { Assessment } from '@mycogni/contracts'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { assessmentOf, fakeSubmit } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { RetakeFlow } from './retake-flow'

const userId = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'

const earlier: Assessment[] = [
  assessmentOf({
    id: '1b7c6c8e-6a8f-4f53-9f4b-000000000001',
    totalScore: 6,
    severity: 'mild',
    completedAt: '2026-10-01T13:00:00Z',
  }),
  assessmentOf({
    id: '1b7c6c8e-6a8f-4f53-9f4b-000000000002',
    instrument: 'gad7',
    totalScore: 0,
    maxScore: 21,
    severity: 'minimal',
    completedAt: '2026-10-01T13:00:00Z',
  }),
]

async function answer(choices: readonly string[], total: number, from = 1, word = 'Pergunta') {
  for (const [offset, choice] of choices.entries()) {
    await screen.findByText(`${word} ${String(from + offset)} de ${String(total)}`)
    await userEvent.click(screen.getByRole('button', { name: choice }))
  }
}

afterEach(() => {
  window.localStorage.clear()
})

describe('RetakeFlow', () => {
  it('reminds when the questions were last answered', () => {
    renderWithIntl(
      <RetakeFlow
        userId={userId}
        assessments={earlier}
        timeZone="America/Sao_Paulo"
        send={fakeSubmit()}
      />,
    )

    expect(
      screen.getByText(/Da última vez você respondeu em quinta-feira, 1 de outubro/),
    ).toBeInTheDocument()
  })

  it('asks the five short questions, stops for support on the safety question and compares with last time', async () => {
    const submit = fakeSubmit()
    renderWithIntl(
      <RetakeFlow
        userId={userId}
        assessments={earlier}
        timeZone="America/Sao_Paulo"
        send={submit}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answer(['Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Vários dias'], 5)
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar o questionário' }))

    expect(
      await screen.findByRole('heading', { name: 'Seus resultados de hoje.' }),
    ).toBeInTheDocument()
    expect(submit.mock.calls.map(([input]) => input.instrument)).toEqual(['gad2', 'phq2'])
    expect(screen.getByRole('region', { name: 'Desânimo' })).toHaveTextContent(
      'Melhor que da última vez',
    )
    expect(screen.getByRole('region', { name: 'Ansiedade' })).toHaveTextContent(
      'Igual à última vez',
    )
    expect(screen.getByRole('link', { name: 'Voltar ao perfil' })).toHaveAttribute(
      'href',
      '/me/wellbeing',
    )
  })

  it('resumes a paused retake at the next question and still compares with before it', async () => {
    const submit = fakeSubmit()
    renderWithIntl(
      <RetakeFlow
        userId={userId}
        assessments={earlier}
        timeZone="America/Sao_Paulo"
        send={submit}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answer(['Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez', 'Nenhuma vez'], 5)
    await screen.findByText('Pergunta 5 de 5')
    const [pending] = submit.mock.results
    const savedAnxiety = pending?.type === 'return' ? await pending.value : null
    cleanup()

    const refreshed = savedAnxiety?.ok === true ? [savedAnxiety.value, ...earlier] : earlier
    renderWithIntl(
      <RetakeFlow
        userId={userId}
        assessments={refreshed}
        timeZone="America/Sao_Paulo"
        send={submit}
      />,
    )

    await answer(['Nenhuma vez'], 5, 5)

    expect(await screen.findByRole('region', { name: 'Ansiedade' })).toHaveTextContent(
      'Igual à última vez',
    )
    expect(submit.mock.calls.map(([input]) => input.instrument)).toEqual(['gad2', 'phq2'])
  })

  it('runs the whole flow in European Portuguese, with more anxiety questions when needed', async () => {
    renderWithIntl(
      <RetakeFlow
        userId={userId}
        assessments={earlier}
        timeZone="Europe/Lisbon"
        send={fakeSubmit()}
      />,
      { locale: 'pt-PT' },
    )

    expect(
      screen.getByText(/Da última vez respondeu em quinta-feira, 1 de outubro/),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answer(
      ['Nunca', 'Nunca', 'Em mais de metade do número de dias', 'Em vários dias', 'Em vários dias'],
      5,
    )

    expect(
      await screen.findByRole('heading', { name: 'Obrigado por partilhar.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar para o SNS 24' })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Continuar o questionário' }))
    expect(
      await screen.findByRole('heading', { name: 'Mais algumas perguntas sobre a ansiedade' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await answer(
      Array.from({ length: 5 }, () => 'Em vários dias'),
      10,
      6,
    )
    expect(screen.queryByText(/de 5$/)).not.toBeInTheDocument()

    expect(
      await screen.findByRole('heading', { name: 'Os seus resultados de hoje.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Ansiedade' })).toHaveTextContent('AnsiedadeLigeiro')
    expect(screen.getByRole('region', { name: 'Ansiedade' })).toHaveTextContent(
      'Mais alto do que da última vez',
    )
    expect(screen.getByRole('link', { name: '112' })).toHaveAttribute('href', 'tel:112')
  })
})
