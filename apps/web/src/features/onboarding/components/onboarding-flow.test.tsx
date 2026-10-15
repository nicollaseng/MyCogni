import { describe, expect, it, jest } from '@jest/globals'
import { phq9 } from '@mycogni/domain'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { OnboardingStart } from '../model'
import { assessmentOf, fakeActions } from '../test/fixtures'
import { OnboardingFlow } from './onboarding-flow'

const signOut = jest.fn(() => Promise.resolve())

function renderFlow(start: OnboardingStart, actions = fakeActions()) {
  render(<OnboardingFlow start={start} actions={actions} signOut={signOut} />)
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
    await userEvent.click(await screen.findByRole('button', { name: 'Começar' }))

    expect(screen.getByRole('heading', { name: phq9.items[0] })).toBeInTheDocument()
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
})
