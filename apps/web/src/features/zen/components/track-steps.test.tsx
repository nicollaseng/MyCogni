import { describe, expect, it, jest } from '@jest/globals'
import type { ZenStepParams } from '@mycogni/contracts'
import { stepMinutes, trackText, tracks } from '@mycogni/domain'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CreateOutcome, PageClient, SaveOutcome } from '@/features/mybook/page-client'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { fakeRouter, WithRouter } from '@/test/router'
import { promptPage } from '../prompt-page'
import { stepTitle } from '../titles'
import { TrackSteps } from './track-steps'

type Save = (step: ZenStepParams, done: boolean) => Promise<ActionResult<null>>

const ok: ActionResult<null> = { ok: true, value: null }

const pageId = '8a7d3c1e-0000-4000-8000-000000000001'

function pageClient(
  created: CreateOutcome = { kind: 'created', id: pageId },
  saved: SaveOutcome = { kind: 'saved', updatedAt: '2026-10-15T12:00:00.000Z' },
) {
  return {
    create: jest.fn<PageClient['create']>().mockResolvedValue(created),
    save: jest.fn<PageClient['save']>().mockResolvedValue(saved),
  }
}

function renderTrack({
  done = [] as string[],
  save = jest.fn<Save>().mockResolvedValue(ok),
  pages = pageClient(),
  narrated = false,
} = {}) {
  const router = fakeRouter()
  const text = trackText('pt-BR', 'everyday-anxiety')
  const steps = tracks['everyday-anxiety'].steps.map((step) => ({
    step,
    title: stepTitle(step, text.steps[step.id] ?? { title: step.id, body: '' }, 'pt-BR'),
    text: text.steps[step.id] ?? { title: step.id, body: '' },
    done: done.includes(step.id),
    minutes: stepMinutes(step, 'pt-BR'),
    narration:
      narrated && step.id === 'reflect'
        ? [{ voice: 'jessica' as const, url: 'https://storage.test/reflect.mp3' }]
        : [],
  }))
  renderWithIntl(
    <WithRouter router={router}>
      <TrackSteps
        trackId="everyday-anxiety"
        steps={steps}
        nextId={steps.find((step) => !step.done)?.step.id ?? null}
        started={done.length > 0}
        support={<p>Linhas de ajuda</p>}
        save={save}
        pages={pages}
      />
    </WithRouter>,
  )
  return { save, pages, router }
}

function stepNamed(name: string): HTMLElement {
  return screen.getByRole('listitem', { name })
}

async function openStep(name: string): Promise<HTMLElement> {
  const step = stepNamed(name)
  await userEvent.setup().click(within(step).getByRole('button', { name: new RegExp(name) }))
  return step
}

describe('TrackSteps', () => {
  it('lists every step as a short row with its kind, duration and done state', () => {
    renderTrack({ done: ['read-anxiety-basics'] })

    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(stepNamed('Ler: o que é ansiedade, e o que não é')).toHaveTextContent(
      /Leitura · \d min · Feito/,
    )
    expect(stepNamed('Respirar em quadrado')).toHaveTextContent('Respiração · 1 min')
    expect(stepNamed('Respirar em quadrado')).not.toHaveTextContent('Feito')
    expect(screen.queryByText(/Quatro ciclos de respiração/)).not.toBeInTheDocument()
  })

  it('offers one primary action for the next step', () => {
    renderTrack({ done: ['read-anxiety-basics'] })

    expect(screen.getByText('Próximo: Respirar em quadrado · 1 min')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Continuar' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
  })

  it('starts a new track by opening its first read', () => {
    renderTrack()

    expect(screen.getByRole('link', { name: 'Começar' })).toHaveAttribute(
      'href',
      '/zen/articles/anxiety-basics',
    )
  })

  it('shows the details of a step only when asked', async () => {
    renderTrack()

    const step = await openStep('Escrever no MyBook')

    expect(within(step).getByRole('blockquote')).toHaveTextContent(
      'Que preocupação voltou mais vezes nesta semana?',
    )
    expect(within(step).getByRole('button', { name: 'Marcar como feito' })).toBeVisible()
  })

  it('marks a step as done and keeps it marked', async () => {
    const user = userEvent.setup()
    const { save } = renderTrack()
    const step = await openStep('Respirar em quadrado')

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
    const step = await openStep('Ler: o que é ansiedade, e o que não é')

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
    const step = await openStep('Refletir')

    await user.click(within(step).getByRole('button', { name: 'Marcar como feito' }))

    expect(await within(step).findByRole('alert')).toHaveTextContent('Não foi possível salvar.')
    await waitFor(() => {
      expect(within(step).getByRole('button', { name: 'Marcar como feito' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
  })

  it('opens a new MyBook page that starts with the writing prompt', async () => {
    const user = userEvent.setup()
    const { pages, router } = renderTrack()
    const step = await openStep('Escrever no MyBook')

    await user.click(within(step).getByRole('button', { name: 'Escrever no MyBook' }))

    expect(pages.create).toHaveBeenCalledTimes(1)
    expect(pages.save).toHaveBeenCalledWith(
      pageId,
      promptPage(
        'Que preocupação voltou mais vezes nesta semana? O que está ao seu alcance fazer sobre ela, e o que não está?',
      ),
    )
    expect(router.push).toHaveBeenCalledWith(`/mybook/${pageId}`)
  })

  it('stays on the track and explains when the page cannot be opened', async () => {
    const user = userEvent.setup()
    const { pages, router } = renderTrack({ pages: pageClient({ kind: 'failed' }) })
    const step = await openStep('Escrever no MyBook')

    await user.click(within(step).getByRole('button', { name: 'Escrever no MyBook' }))

    expect(await within(step).findByRole('alert')).toHaveTextContent(
      'Não foi possível abrir uma página no MyBook agora.',
    )
    expect(pages.save).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('opens the breathing exercise in a sheet', async () => {
    const user = userEvent.setup()
    renderTrack({ done: ['read-anxiety-basics'] })

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const dialog = screen.getByRole('dialog', { name: 'Respirar em quadrado' })
    expect(within(dialog).getByRole('button', { name: 'Começar' })).toBeInTheDocument()
  })

  it('reads a step out loud only when its narration exists', async () => {
    renderTrack({ narrated: true })

    const reflect = await openStep('Refletir')
    expect(within(reflect).getByRole('button', { name: 'Ouvir: Refletir' })).toBeVisible()

    const breathe = await openStep('Respirar em quadrado')
    expect(within(breathe).queryByRole('button', { name: /Ouvir/ })).not.toBeInTheDocument()
  })
})
