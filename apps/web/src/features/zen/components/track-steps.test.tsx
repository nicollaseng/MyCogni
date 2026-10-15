import { describe, expect, it, jest } from '@jest/globals'
import type { ZenStepParams } from '@mycogni/contracts'
import { tracks } from '@mycogni/domain'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { trackText } from '../content/tracks'
import { TrackSteps } from './track-steps'

type Save = (step: ZenStepParams, done: boolean) => Promise<ActionResult<null>>
type Write = (step: ZenStepParams) => Promise<ActionResult<null>>

const ok: ActionResult<null> = { ok: true, value: null }

function renderTrack({
  done = [] as string[],
  save = jest.fn<Save>().mockResolvedValue(ok),
  write = jest.fn<Write>().mockResolvedValue(ok),
} = {}) {
  const text = trackText('pt-BR', 'everyday-anxiety')
  const steps = tracks['everyday-anxiety'].steps.map((step) => ({
    step,
    text: text.steps[step.id] ?? { title: step.id, body: '' },
    done: done.includes(step.id),
  }))
  renderWithIntl(
    <TrackSteps
      trackId="everyday-anxiety"
      steps={steps}
      nextId={steps.find((step) => !step.done)?.step.id ?? null}
      support={<p>Linhas de ajuda</p>}
      save={save}
      write={write}
    />,
  )
  return { save, write }
}

function stepNamed(name: string): HTMLElement {
  return screen.getByRole('listitem', { name })
}

describe('TrackSteps', () => {
  it('lists every step in order with its way in', () => {
    renderTrack()

    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(
      within(stepNamed('Ler: o que é ansiedade, e o que não é')).getByRole('link', { name: 'Ler' }),
    ).toHaveAttribute('href', '/zen/articles/anxiety-basics')
    expect(
      within(stepNamed('Registrar como você está')).getByRole('link', {
        name: 'Fazer um registro',
      }),
    ).toHaveAttribute('href', '/check-in')
    expect(within(stepNamed('Escrever no MyBook')).getByRole('blockquote')).toHaveTextContent(
      'Que preocupação voltou mais vezes nesta semana?',
    )
  })

  it('marks a step as done and keeps it marked', async () => {
    const user = userEvent.setup()
    const { save } = renderTrack()
    const step = stepNamed('Respirar em quadrado')

    await user.click(within(step).getByRole('button', { name: 'Marcar como feito' }))

    expect(save).toHaveBeenCalledWith({ trackId: 'everyday-anxiety', stepId: 'breathe' }, true)
    expect(within(step).getByRole('button', { name: 'Feito' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('undoes a step that was done', async () => {
    const user = userEvent.setup()
    const { save } = renderTrack({ done: ['read-anxiety-basics'] })
    const step = stepNamed('Ler: o que é ansiedade, e o que não é')

    await user.click(within(step).getByRole('button', { name: 'Feito' }))

    expect(save).toHaveBeenCalledWith(
      { trackId: 'everyday-anxiety', stepId: 'read-anxiety-basics' },
      false,
    )
  })

  it('goes back to the saved state and says so when saving fails', async () => {
    const user = userEvent.setup()
    renderTrack({
      save: jest.fn<Save>().mockResolvedValue({ ok: false, error: 'Não foi possível salvar.' }),
    })
    const step = stepNamed('Refletir')

    await user.click(within(step).getByRole('button', { name: 'Marcar como feito' }))

    expect(await within(step).findByRole('alert')).toHaveTextContent('Não foi possível salvar.')
    await waitFor(() => {
      expect(within(step).getByRole('button', { name: 'Marcar como feito' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
  })

  it('opens a MyBook page from the writing prompt', async () => {
    const user = userEvent.setup()
    const { write } = renderTrack()

    await user.click(
      within(stepNamed('Escrever no MyBook')).getByRole('button', { name: 'Escrever no MyBook' }),
    )

    expect(write).toHaveBeenCalledWith({ trackId: 'everyday-anxiety', stepId: 'write-worry' })
  })

  it('opens the breathing exercise in a sheet', async () => {
    const user = userEvent.setup()
    renderTrack()

    await user.click(screen.getByRole('button', { name: 'Começar o exercício' }))

    const dialog = screen.getByRole('dialog', { name: 'Respirar em quadrado' })
    expect(within(dialog).getByRole('button', { name: 'Começar' })).toBeInTheDocument()
  })
})
