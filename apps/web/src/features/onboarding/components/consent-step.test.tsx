import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeActions } from '../test/fixtures'
import { ConsentStep } from './consent-step'

function renderStep(actions = fakeActions()) {
  const onDone = jest.fn()
  render(<ConsentStep accept={actions.acceptConsents} onDone={onDone} />)
  return { actions, onDone }
}

const requiredLabels = [
  'Tenho 18 anos ou mais.',
  /Li e aceito os Termos de uso/,
  /Autorizo o tratamento dos meus registros/,
]

describe('ConsentStep', () => {
  it('waits for every required consent before continuing', async () => {
    const user = userEvent.setup()
    renderStep()
    const button = screen.getByRole('button', { name: 'Concordar e continuar' })

    for (const label of requiredLabels.slice(0, 2)) {
      await user.click(screen.getByRole('checkbox', { name: label }))
    }
    expect(button).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: requiredLabels[2] }))
    expect(button).toBeEnabled()
  })

  it('leaves the use of AI out unless it is chosen', async () => {
    const user = userEvent.setup()
    const { actions, onDone } = renderStep()

    for (const label of requiredLabels) {
      await user.click(screen.getByRole('checkbox', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Concordar e continuar' }))

    expect(actions.acceptConsents).toHaveBeenCalledWith([
      'adult',
      'terms',
      'privacy',
      'health_data',
    ])
    expect(onDone).toHaveBeenCalled()
  })

  it('includes the use of AI when it is chosen', async () => {
    const user = userEvent.setup()
    const { actions } = renderStep()

    for (const label of [...requiredLabels, /quero que a IA escreva resumos/]) {
      await user.click(screen.getByRole('checkbox', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Concordar e continuar' }))

    expect(actions.acceptConsents).toHaveBeenCalledWith([
      'adult',
      'terms',
      'privacy',
      'health_data',
      'ai_processing',
    ])
  })

  it('opens the legal documents in a new tab', () => {
    renderStep()

    expect(screen.getByRole('link', { name: 'Termos de uso' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })

  it('says when the consents could not be saved', async () => {
    const user = userEvent.setup()
    const actions = fakeActions({
      acceptConsents: jest.fn(() => Promise.resolve({ ok: false as const, error: 'Falhou.' })),
    })
    const { onDone } = renderStep(actions)

    for (const label of requiredLabels) {
      await user.click(screen.getByRole('checkbox', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Concordar e continuar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falhou.')
    expect(onDone).not.toHaveBeenCalled()
  })
})
