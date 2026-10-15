import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { assessmentOf, fakeActions } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { RetakeFlow } from './retake-flow'

async function answerAll(
  total: number,
  progress: (index: number) => string,
  choice: string,
  last = choice,
) {
  for (let index = 1; index <= total; index++) {
    await screen.findByText(progress(index))
    await userEvent.click(screen.getByRole('button', { name: index === total ? last : choice }))
  }
}

function inPortuguese(name: string, total: number) {
  return (index: number) => `${name} · ${String(index)} de ${String(total)}`
}

const previous = {
  phq9: assessmentOf({ totalScore: 6, completedAt: '2026-10-01T13:00:00Z' }),
  gad7: assessmentOf({
    instrument: 'gad7',
    totalScore: 0,
    maxScore: 21,
    severity: 'minimal',
    completedAt: '2026-10-01T13:00:00Z',
  }),
}

describe('RetakeFlow', () => {
  it('reminds when the forms were last answered', () => {
    renderWithIntl(
      <RetakeFlow
        previous={previous}
        timeZone="America/Sao_Paulo"
        send={fakeActions().submitScreening}
      />,
    )

    expect(
      screen.getByText(/Da última vez você respondeu em quinta-feira, 1 de outubro/),
    ).toBeInTheDocument()
  })

  it('goes through both forms, stops for support on item 9 and compares with last time', async () => {
    renderWithIntl(
      <RetakeFlow
        previous={previous}
        timeZone="America/Sao_Paulo"
        send={fakeActions().submitScreening}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll(9, inPortuguese('PHQ-9', 9), 'Nenhuma vez', 'Vários dias')
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar o questionário' }))
    await answerAll(7, inPortuguese('GAD-7', 7), 'Nenhuma vez')

    expect(
      await screen.findByRole('heading', { name: 'Seus resultados de hoje.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sinais de depressão' })).toHaveTextContent(
      '5 pontos a menos que em 1 de outubro',
    )
    expect(screen.getByRole('region', { name: 'Sinais de ansiedade' })).toHaveTextContent(
      'Igual a 1 de outubro',
    )
    expect(screen.getByRole('link', { name: 'Voltar ao perfil' })).toHaveAttribute('href', '/me')
  })

  it('keeps comparing with the answers from before the flow, even after the page refreshes', async () => {
    const send = fakeActions().submitScreening
    const { rerender } = renderWithIntl(
      <RetakeFlow previous={previous} timeZone="America/Sao_Paulo" send={send} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll(9, inPortuguese('PHQ-9', 9), 'Nenhuma vez')
    rerender(
      <RetakeFlow
        previous={{ ...previous, phq9: assessmentOf({ totalScore: 0 }) }}
        timeZone="America/Sao_Paulo"
        send={send}
      />,
    )
    await answerAll(7, inPortuguese('GAD-7', 7), 'Nenhuma vez')

    expect(await screen.findByRole('region', { name: 'Sinais de depressão' })).toHaveTextContent(
      '6 pontos a menos que em 1 de outubro',
    )
  })

  it('runs the whole flow in European Portuguese with the Portuguese crisis lines', async () => {
    renderWithIntl(
      <RetakeFlow
        previous={previous}
        timeZone="Europe/Lisbon"
        send={fakeActions().submitScreening}
      />,
      { locale: 'pt-PT' },
    )

    expect(
      screen.getByText(/Da última vez respondeu em quinta-feira, 1 de outubro/),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll(9, inPortuguese('PHQ-9', 9), 'Nunca', 'Em vários dias')

    expect(
      await screen.findByRole('heading', { name: 'Obrigado por partilhar.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ligar para o SNS 24' })).toHaveAttribute(
      'href',
      'tel:808242424',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Continuar o questionário' }))
    await answerAll(7, inPortuguese('GAD-7', 7), 'Em vários dias')

    expect(
      await screen.findByRole('heading', { name: 'Os seus resultados de hoje.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sinais de ansiedade' })).toHaveTextContent(
      '7 pontos a mais do que em 1 de outubro',
    )
    expect(screen.getByRole('link', { name: '112' })).toHaveAttribute('href', 'tel:112')
    expect(screen.getByRole('link', { name: 'Voltar ao perfil' })).toHaveAttribute('href', '/me')
  })
})
