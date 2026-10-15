import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { assessmentOf, fakeActions } from '@/features/onboarding/test/fixtures'
import { RetakeFlow } from './retake-flow'

async function answerAll(total: number, name: string, last = 'Nenhuma vez') {
  for (let index = 1; index <= total; index++) {
    await screen.findByText(`${name} · ${String(index)} de ${String(total)}`)
    await userEvent.click(
      screen.getByRole('button', { name: index === total ? last : 'Nenhuma vez' }),
    )
  }
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
    render(
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
    render(
      <RetakeFlow
        previous={previous}
        timeZone="America/Sao_Paulo"
        send={fakeActions().submitScreening}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll(9, 'PHQ-9', 'Vários dias')
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar o questionário' }))
    await answerAll(7, 'GAD-7')

    expect(
      await screen.findByRole('heading', { name: 'Seus resultados de hoje.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sinais de depressão' })).toHaveTextContent(
      '5 pontos a menos que em 1 de outubro',
    )
    expect(screen.getByRole('region', { name: 'Sinais de ansiedade' })).toHaveTextContent(
      'Igual a 1 de outubro',
    )
    expect(screen.getByRole('link', { name: 'Voltar para Você' })).toHaveAttribute('href', '/me')
  })

  it('keeps comparing with the answers from before the flow, even after the page refreshes', async () => {
    const send = fakeActions().submitScreening
    const { rerender } = render(
      <RetakeFlow previous={previous} timeZone="America/Sao_Paulo" send={send} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll(9, 'PHQ-9')
    rerender(
      <RetakeFlow
        previous={{ ...previous, phq9: assessmentOf({ totalScore: 0 }) }}
        timeZone="America/Sao_Paulo"
        send={send}
      />,
    )
    await answerAll(7, 'GAD-7')

    expect(await screen.findByRole('region', { name: 'Sinais de depressão' })).toHaveTextContent(
      '6 pontos a menos que em 1 de outubro',
    )
  })
})
