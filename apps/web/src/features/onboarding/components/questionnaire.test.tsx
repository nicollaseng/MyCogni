import { describe, expect, it, jest } from '@jest/globals'
import { gad7, phq9 } from '@mycogni/domain'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeActions } from '../test/fixtures'
import { Questionnaire } from './questionnaire'

async function answer(label: string) {
  await userEvent.click(screen.getByRole('button', { name: label }))
}

describe('Questionnaire', () => {
  it('asks one question at a time with the prompt of the form', () => {
    render(
      <Questionnaire instrument={phq9} send={fakeActions().submitScreening} onDone={jest.fn()} />,
    )

    expect(screen.getByText('PHQ-9 · 1 de 9')).toBeInTheDocument()
    expect(screen.getByText(phq9.prompt)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Pouco interesse ou pouco prazer em fazer as coisas' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4)
  })

  it('moves on as soon as an answer is chosen and keeps it when going back', async () => {
    render(
      <Questionnaire instrument={gad7} send={fakeActions().submitScreening} onDone={jest.fn()} />,
    )

    await answer('Vários dias')

    expect(await screen.findByText('GAD-7 · 2 de 7')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: gad7.items[1] })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByRole('button', { name: 'Vários dias' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('sends every answer once the last question is answered', async () => {
    const actions = fakeActions()
    const onDone = jest.fn()
    render(<Questionnaire instrument={gad7} send={actions.submitScreening} onDone={onDone} />)

    const choices = ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias']
    for (const [index, value] of [0, 1, 2, 3, 0, 1, 2].entries()) {
      await screen.findByText(`GAD-7 · ${String(index + 1)} de 7`)
      await answer(choices[value] ?? '')
    }

    expect(actions.submitScreening).toHaveBeenCalledTimes(1)
    expect(actions.submitScreening).toHaveBeenCalledWith({
      instrument: 'gad7',
      answers: [0, 1, 2, 3, 0, 1, 2],
    })
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ totalScore: 9 }))
  })

  it('offers to try again when the answers could not be saved', async () => {
    const send = jest
      .fn<ReturnType<typeof fakeActions>['submitScreening']>()
      .mockResolvedValueOnce({ ok: false, error: 'Não conseguimos salvar.' })
      .mockImplementation(fakeActions().submitScreening)
    const onDone = jest.fn()
    render(<Questionnaire instrument={gad7} send={send} onDone={onDone} />)

    for (let index = 1; index <= 7; index++) {
      await screen.findByText(`GAD-7 · ${String(index)} de 7`)
      await answer('Nenhuma vez')
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos salvar.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(send).toHaveBeenCalledTimes(2)
    expect(onDone).toHaveBeenCalled()
  })
})
