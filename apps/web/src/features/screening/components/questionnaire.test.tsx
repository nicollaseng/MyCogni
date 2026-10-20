import { describe, expect, it, jest } from '@jest/globals'
import { gad7, instrumentText, phq9 } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeActions } from '@/features/onboarding/test/fixtures'
import { renderWithIntl } from '@/test/render'
import { Questionnaire } from './questionnaire'

async function answer(label: string) {
  await userEvent.click(screen.getByRole('button', { name: label }))
}

describe('Questionnaire', () => {
  it('asks one question at a time with the prompt of the form', () => {
    renderWithIntl(
      <Questionnaire instrument={phq9} send={fakeActions().submitScreening} onDone={jest.fn()} />,
    )

    expect(screen.getByText('Desânimo · 1 de 9')).toBeInTheDocument()
    expect(screen.getByText(instrumentText('pt-BR', 'phq9').prompt)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Pouco interesse ou pouco prazer em fazer as coisas' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4)
  })

  it('moves on as soon as an answer is chosen and keeps it when going back', async () => {
    renderWithIntl(
      <Questionnaire instrument={gad7} send={fakeActions().submitScreening} onDone={jest.fn()} />,
    )

    await answer('Vários dias')

    expect(await screen.findByText('Ansiedade · 2 de 7')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: instrumentText('pt-BR', 'gad7').items[1] }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByRole('button', { name: 'Vários dias' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('sends every answer once the last question is answered', async () => {
    const actions = fakeActions()
    const onDone = jest.fn()
    renderWithIntl(
      <Questionnaire instrument={gad7} send={actions.submitScreening} onDone={onDone} />,
    )

    const choices = ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias']
    for (const [index, value] of [0, 1, 2, 3, 0, 1, 2].entries()) {
      await screen.findByText(`Ansiedade · ${String(index + 1)} de 7`)
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
    renderWithIntl(<Questionnaire instrument={gad7} send={send} onDone={onDone} />)

    for (let index = 1; index <= 7; index++) {
      await screen.findByText(`Ansiedade · ${String(index)} de 7`)
      await answer('Nenhuma vez')
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos salvar.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(send).toHaveBeenCalledTimes(2)
    expect(onDone).toHaveBeenCalled()
  })

  it('uses the official European Portuguese wording in Portugal', () => {
    renderWithIntl(
      <Questionnaire instrument={phq9} send={fakeActions().submitScreening} onDone={jest.fn()} />,
      { locale: 'pt-PT' },
    )

    expect(
      screen.getByText(
        'Durante os últimos 14 dias, em quantos foi afectado/a por algum dos seguintes problemas?',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tive pouco interesse ou prazer em fazer coisas' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { pressed: false }).map((button) => button.textContent),
    ).toEqual([
      'Nunca',
      'Em vários dias',
      'Em mais de metade do número de dias',
      'Em quase todos os dias',
    ])
  })

  it('uses the official English wording and keeps the chosen answer', async () => {
    const actions = fakeActions()
    renderWithIntl(
      <Questionnaire instrument={gad7} send={actions.submitScreening} onDone={jest.fn()} />,
      { locale: 'en-US' },
    )

    expect(screen.getByText('Anxiety · 1 of 7')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Feeling nervous, anxious or on edge' }),
    ).toBeInTheDocument()

    await answer('Several days')
    expect(await screen.findByText('Anxiety · 2 of 7')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByRole('button', { name: 'Several days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
