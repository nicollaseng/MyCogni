import { describe, expect, it, jest } from '@jest/globals'
import type { CreateAssignmentInput, ProfessionalAssignment } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { assignment, catalogFor } from '../questionnaire-test-data'
import { ReleaseForm } from './release-form'

function releaseResult(
  result: ActionResult<ProfessionalAssignment>,
): jest.Mock<(input: CreateAssignmentInput) => Promise<ActionResult<ProfessionalAssignment>>> {
  return jest.fn(() => Promise.resolve(result))
}

describe('ReleaseForm', () => {
  it('disables the GAD-7 for psychologists and says why', async () => {
    renderWithIntl(
      <ReleaseForm
        catalog={catalogFor('psychologist', 'pt-BR')}
        release={releaseResult({ ok: true, value: assignment({}) })}
        onReleased={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Ansiedade generalizada' }))
    const gad = screen.getByRole('radio', { name: /^GAD-7/ })
    expect(gad).toBeDisabled()
    expect(
      screen.getByText("Indisponível para psicólogos: consta como 'Não avaliado' no SATEPSI."),
    ).toBeInTheDocument()
    expect(screen.getByText('SATEPSI: Não avaliado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liberar' })).toBeDisabled()
  })

  it('offers the GAD-7 to psychiatrists', async () => {
    renderWithIntl(
      <ReleaseForm
        catalog={catalogFor('psychiatrist', 'pt-BR')}
        release={releaseResult({ ok: true, value: assignment({}) })}
        onReleased={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Ansiedade generalizada' }))
    expect(screen.getByRole('radio', { name: /^GAD-7/ })).toBeChecked()
  })

  it('shows items, minutes, use, recommendation and SATEPSI for each option', () => {
    renderWithIntl(
      <ReleaseForm
        catalog={catalogFor('psychologist', 'pt-BR')}
        release={releaseResult({ ok: true, value: assignment({}) })}
        onReleased={jest.fn()}
      />,
    )

    const instruments = screen.getByRole('group', { name: 'Instrumento' })
    expect(within(instruments).getByRole('radio', { name: /^PHQ-9/ })).toBeChecked()
    expect(
      within(instruments).getByText('9 itens · ~3 min · rastreio, gravidade, monitoramento'),
    ).toBeInTheDocument()
    expect(within(instruments).getByText('SATEPSI: Não privativo')).toBeInTheDocument()
    expect(within(instruments).getByText('Item de segurança')).toBeInTheDocument()
    expect(
      within(instruments).getByText(
        'Preferido quando há acompanhamento: o item 9 gera alerta urgente.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Status SATEPSI verificado em 22 de out. de 2026.')).toBeInTheDocument()
  })

  it('disables instruments without an official text in the patient language', async () => {
    renderWithIntl(
      <ReleaseForm
        catalog={catalogFor('psychiatrist', 'pt-PT')}
        release={releaseResult({ ok: true, value: assignment({}) })}
        onReleased={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Sofrimento psicológico' }))
    expect(screen.getByRole('radio', { name: /^K10/ })).toBeDisabled()
    expect(screen.getAllByText('Sem texto oficial no idioma do paciente.')).toHaveLength(2)
  })

  it('releases the chosen instrument with the message and the repetition', async () => {
    const release = releaseResult({ ok: true, value: assignment({}) })
    const onReleased = jest.fn()
    renderWithIntl(
      <ReleaseForm
        catalog={catalogFor('psychologist', 'pt-BR')}
        release={release}
        onReleased={onReleased}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: 'Estresse pós-traumático' }))
    await userEvent.type(
      screen.getByLabelText('Mensagem para o paciente (opcional)'),
      'Pense no acidente.',
    )
    await userEvent.click(screen.getByRole('radio', { name: 'A cada 14 dias' }))
    await userEvent.click(screen.getByRole('button', { name: 'Liberar' }))

    expect(release).toHaveBeenCalledWith({
      variant: 'pcl5',
      note: 'Pense no acidente.',
      repeatEveryDays: 14,
    })
    expect(onReleased).toHaveBeenCalled()
  })

  it('shows why a release failed', async () => {
    renderWithIntl(
      <ReleaseForm
        catalog={catalogFor('psychologist', 'pt-BR')}
        release={releaseResult({ ok: false, error: 'Já existe um questionário igual em aberto.' })}
        onReleased={jest.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Liberar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe um questionário igual em aberto.',
    )
  })
})
