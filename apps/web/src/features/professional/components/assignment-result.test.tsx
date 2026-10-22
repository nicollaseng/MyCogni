import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { assignment, detailOf } from '../questionnaire-test-data'
import { AssignmentResult } from './assignment-result'

const disclaimer =
  'Resultado de instrumento de rastreio autoaplicado. Requer avaliação clínica. Não é diagnóstico.'

describe('AssignmentResult', () => {
  it('shows the PHQ-9 total, band with source, items and the item 9 flag', () => {
    renderWithIntl(
      <AssignmentResult
        detail={detailOf('phq9', [1, 1, 0, 2, 1, 1, 0, 0, 1])}
        patientName="Ana Lima"
        timeZone="America/Sao_Paulo"
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'PHQ-9' })).toBeInTheDocument()
    expect(screen.getByText(disclaimer)).toBeInTheDocument()
    expect(screen.getByText('Fonte complementar.')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Item 9 acima de zero.')
    expect(screen.getAllByText('Leve').length).toBeGreaterThan(0)
    expect(screen.getByText(/606-613\. PHQ Instruction Manual/)).toBeInTheDocument()
    const items = screen.getByRole('table', { name: 'Respostas por item' })
    expect(
      within(items).getByText(
        'Pensar em se ferir de alguma maneira ou que seria melhor estar morto/a',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ana Lima' })).toHaveAttribute(
      'href',
      `/pro/patients/${assignment({}).patientId}`,
    )
  })

  it('shows the PCL-5 clusters, the DSM-5 rule and the suicide screening note', () => {
    renderWithIntl(
      <AssignmentResult
        detail={detailOf(
          'pcl5',
          Array.from({ length: 20 }, () => 2),
          {
            complementarySource: false,
          },
        )}
        patientName="Ana Lima"
        timeZone="America/Sao_Paulo"
      />,
    )

    expect(screen.getByText(disclaimer)).toBeInTheDocument()
    expect(screen.queryByText('Fonte complementar.')).not.toBeInTheDocument()
    expect(screen.getByText('B · Intrusão')).toBeInTheDocument()
    expect(screen.getByText('E · Excitação e reatividade')).toBeInTheDocument()
    expect(screen.getByText('Regra provisória do DSM-5 atendida')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(
      'considere uma avaliação de risco de suicídio',
    )
    expect(screen.getByText(/Eur J Psychotraumatol 2019/)).toBeInTheDocument()
    expect(screen.getByText(/ponto de corte entre 31 e 33/)).toBeInTheDocument()
  })

  it('shows the ASRS continuous score, the shaded count and the mandatory notice', () => {
    renderWithIntl(
      <AssignmentResult
        detail={detailOf('asrs6', [2, 2, 2, 3, 3, 3])}
        patientName="Ana Lima"
        timeZone="America/Sao_Paulo"
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'ASRS v1.1 Parte A' })).toBeInTheDocument()
    expect(screen.getAllByText('Positivo baixo').length).toBeGreaterThan(0)
    expect(screen.getByText(/6 de 6 respostas na faixa sombreada/)).toBeInTheDocument()
    expect(
      screen.getByText('© New York University and the President and Fellows of Harvard College'),
    ).toBeInTheDocument()
  })

  it('labels the K10 bands as not universal', () => {
    renderWithIntl(
      <AssignmentResult
        detail={detailOf(
          'k10',
          Array.from({ length: 10 }, () => 3),
        )}
        patientName="Ana Lima"
        timeZone="America/Sao_Paulo"
      />,
    )

    expect(screen.getByText(/Faixas não universais/)).toBeInTheDocument()
  })

  it('waits for the answers before showing a result', () => {
    renderWithIntl(
      <AssignmentResult
        detail={{
          assignment: assignment({ status: 'in_progress' }),
          complementarySource: true,
          response: null,
          trend: [],
        }}
        patientName="Ana Lima"
        timeZone="America/Sao_Paulo"
      />,
    )

    expect(screen.getByText('O paciente ainda não terminou de responder.')).toBeInTheDocument()
    expect(screen.getByText(disclaimer)).toBeInTheDocument()
  })
})
