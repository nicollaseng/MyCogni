import { describe, expect, it, jest } from '@jest/globals'
import type { QuestionnaireRun } from '@mycogni/contracts'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { anxietyContent, run } from '../test-data'
import { RunFlow, type RunActions } from './run-flow'

function ok(value: QuestionnaireRun): Promise<ActionResult<QuestionnaireRun>> {
  return Promise.resolve({ ok: true, value })
}

function fakeActions(summary: QuestionnaireRun['summary']): RunActions {
  let current = run({})
  return {
    begin: jest.fn(() => ok(current)),
    save: jest.fn((_id: string, item: number, value: number) => {
      current = {
        ...current,
        answers: current.answers.map((answer, index) => (index === item ? value : answer)),
      }
      return ok(current)
    }),
    finish: jest.fn(() => ok({ ...current, status: 'completed', summary })),
  }
}

describe('RunFlow', () => {
  it('shows the plain area, the size, the message and the notice before starting', () => {
    renderWithIntl(
      <RunFlow
        initial={run({ status: 'assigned', content: null, note: 'Antes da consulta, por favor.' })}
        actions={fakeActions(null)}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Sobre ansiedade' })).toBeInTheDocument()
    expect(screen.getByText('3 perguntas · cerca de 2 min')).toBeInTheDocument()
    expect(screen.getByText('Mensagem de Dra. Helena Prado')).toBeInTheDocument()
    expect(screen.getByText('Antes da consulta, por favor.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Seu profissional verá suas respostas completas. Você verá um resumo simples. Isto não é um diagnóstico.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Agora não' })).toHaveAttribute('href', '/today')
    expect(screen.queryByText(/GAD/)).not.toBeInTheDocument()
  })

  it('starts, asks one official question per screen with its period and shows a plain summary', async () => {
    const actions = fakeActions({ area: 'anxiety', level: 'mild', safety: false })
    renderWithIntl(
      <RunFlow initial={run({ status: 'assigned', content: null })} actions={actions} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
    for (const [index, choice] of [
      'Vários dias',
      'Nenhuma vez',
      'Mais da metade dos dias',
    ].entries()) {
      await screen.findByText(`Pergunta ${String(index + 1)} de 3`)
      expect(
        screen.getByText(
          'Durante as últimas 2 semanas, com que freqüência você foi incomodado/a pelos problemas abaixo?',
        ),
      ).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: choice }))
    }

    expect(
      await screen.findByRole('heading', { name: 'Obrigado por responder.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Leve')).toBeInTheDocument()
    expect(
      screen.getByText('Nas últimas 2 semanas, suas respostas mostram sinais leves de ansiedade.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Converse com seu profissional sobre isso.')).toBeInTheDocument()
    expect(actions.save).toHaveBeenCalledTimes(3)
    expect(actions.finish).toHaveBeenCalledTimes(1)
  })

  it('resumes at the first unanswered question and lets the patient pause', async () => {
    renderWithIntl(<RunFlow initial={run({ answers: [1, 0, null] })} actions={fakeActions(null)} />)

    expect(await screen.findByText('Pergunta 3 de 3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pausar' })).toHaveAttribute(
      'href',
      '/me/questionnaires',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nenhuma vez' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows the support step first and never a low level after a safety answer', async () => {
    renderWithIntl(
      <RunFlow
        initial={run({ answers: [0, 0, null] })}
        actions={fakeActions({ area: 'depression', level: 'low', safety: true })}
      />,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Nenhuma vez' }))
    expect(await screen.findByRole('heading', { name: 'Obrigado por contar.' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver o resumo' }))

    expect(
      await screen.findByRole('heading', { name: 'Obrigado por responder.' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Baixo')).not.toBeInTheDocument()
    expect(screen.getByText(/Algumas respostas pedem cuidado/)).toBeInTheDocument()
    expect(screen.getByText('Se pensar em se ferir, ligue:')).toBeInTheDocument()
  })

  it('shows the official notice next to the items that require it', async () => {
    renderWithIntl(
      <RunFlow
        initial={run({
          content: {
            ...anxietyContent,
            notice: '© New York University and the President and Fellows of Harvard College',
          },
        })}
        actions={fakeActions(null)}
      />,
    )

    expect(
      await screen.findByText(
        '© New York University and the President and Fellows of Harvard College',
      ),
    ).toBeInTheDocument()
  })

  it('keeps the answer and offers a retry when saving fails', async () => {
    const actions = fakeActions(null)
    actions.save = jest.fn(() =>
      Promise.resolve<ActionResult<QuestionnaireRun>>({ ok: false, error: 'Falhou.' }),
    )
    renderWithIntl(<RunFlow initial={run({})} actions={actions} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Vários dias' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Falhou.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(actions.save).toHaveBeenCalledTimes(2)
  })

  it('tells the patient when the questionnaire is closed', () => {
    renderWithIntl(<RunFlow initial={run({ status: 'cancelled' })} actions={fakeActions(null)} />)

    expect(
      screen.getByRole('heading', { name: 'Este questionário não está mais disponível.' }),
    ).toBeInTheDocument()
  })
})
