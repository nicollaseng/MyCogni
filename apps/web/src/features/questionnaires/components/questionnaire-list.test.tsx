import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { openAssignment } from '../test-data'
import { AssignedCard } from './assigned-card'
import { QuestionnaireList } from './questionnaire-list'

const professional = { name: 'Dra. Helena Prado', kind: 'psychologist' } as const

describe('QuestionnaireList', () => {
  it('lists what to answer first and then the answered ones with a plain summary', () => {
    renderWithIntl(
      <QuestionnaireList
        timeZone="America/Sao_Paulo"
        questionnaires={{
          open: [
            openAssignment({ id: 'a', area: 'trauma', itemCount: 20, minutes: 7 }),
            openAssignment({ id: 'b', status: 'in_progress', answered: 4 }),
          ],
          answered: [
            {
              id: 'c',
              area: 'distress',
              completedAt: '2026-10-21T15:00:00Z',
              summary: { area: 'distress', level: 'moderate', safety: false },
              professional,
            },
            {
              id: 'd',
              area: 'depression',
              completedAt: '2026-10-20T15:00:00Z',
              summary: { area: 'depression', level: 'low', safety: true },
              professional,
            },
          ],
        }}
      />,
    )

    const open = screen.getByRole('region', { name: 'Para responder' })
    expect(within(open).getByText('Sobre lembranças de um evento difícil')).toBeInTheDocument()
    expect(within(open).getByText('20 perguntas · cerca de 7 min')).toBeInTheDocument()
    expect(within(open).getByText('4 de 9 respondidas')).toBeInTheDocument()
    expect(within(open).getByRole('link', { name: 'Continuar' })).toHaveAttribute(
      'href',
      '/questionnaires/b',
    )
    const answered = screen.getByRole('region', { name: 'Respondidos' })
    expect(within(answered).getAllByRole('listitem')[0]).toHaveTextContent(
      'Mal-estar emocional: Moderado',
    )
    expect(
      within(answered).getByText(
        'Nos últimos 30 dias, suas respostas mostram um mal-estar emocional moderado.',
      ),
    ).toBeInTheDocument()
    expect(within(answered).getAllByRole('listitem')[1]).toHaveTextContent(
      'Desânimo: Algumas respostas pedem cuidado',
    )
    expect(within(answered).queryByText('Baixo')).not.toBeInTheDocument()
    expect(screen.queryByText(/PHQ|PCL|K10/)).not.toBeInTheDocument()
  })

  it('explains where questionnaires appear when there are none', () => {
    renderWithIntl(
      <QuestionnaireList
        timeZone="America/Sao_Paulo"
        questionnaires={{ open: [], answered: [] }}
      />,
    )

    expect(
      screen.getByText('Quando seu profissional liberar um questionário, ele aparece aqui.'),
    ).toBeInTheDocument()
  })
})

describe('AssignedCard', () => {
  it('invites the patient calmly to the questionnaire on Hoje', () => {
    renderWithIntl(
      <AssignedCard open={[openAssignment({ id: 'x' }), openAssignment({ id: 'y' })]} />,
    )

    expect(
      screen.getByRole('heading', { name: 'Seu profissional liberou um questionário' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Sobre ânimo/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Responder' })).toHaveAttribute(
      'href',
      '/questionnaires/x',
    )
    expect(screen.getByText(/Há mais 1 questionário para responder/)).toBeInTheDocument()
  })

  it('shows nothing when nothing is open', () => {
    const { container } = renderWithIntl(<AssignedCard open={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
