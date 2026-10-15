import { describe, expect, it, jest } from '@jest/globals'
import type { CheckIn, CreateCheckInInput } from '@mycogni/contracts'
import type { Locale } from '@mycogni/domain'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { CheckInFlow } from './check-in-flow'

type Save = (input: CreateCheckInInput) => Promise<ActionResult<CheckIn>>

function savedAs(input: CreateCheckInInput): Promise<ActionResult<CheckIn>> {
  return Promise.resolve({
    ok: true,
    value: {
      ...input,
      id: '0b7c6c8e-6a8f-4f53-9f4b-000000000001',
      recordedAt: '2026-10-14T12:05:00Z',
    },
  })
}

function renderFlow(save = jest.fn<Save>(savedAs), locale: Locale = 'pt-BR') {
  renderWithIntl(
    <CheckInFlow today="Quarta-feira, 14 de outubro" timeZone="America/Sao_Paulo" save={save} />,
    { locale },
  )
  return save
}

function slider(name = 'Como você está agora?'): HTMLElement {
  return screen.getByRole('slider', { name })
}

describe('CheckInFlow', () => {
  it('starts neutral and names each mood as the slider moves', () => {
    renderFlow()

    expect(slider()).toHaveAttribute('aria-valuetext', 'Neutro')

    fireEvent.change(slider(), { target: { value: '1' } })

    expect(slider()).toHaveAttribute('aria-valuetext', 'Mal')
  })

  it('records only the mood in a single tap', async () => {
    const user = userEvent.setup()
    renderFlow()

    fireEvent.change(slider(), { target: { value: '0' } })
    await user.click(screen.getByRole('button', { name: 'Registrar só o humor' }))

    expect(await screen.findByRole('heading', { name: 'Registrado às 09:05.' })).toBeInTheDocument()
    expect(screen.getByText('muito mal')).toBeInTheDocument()
  })

  it('suggests emotions that match the chosen mood', async () => {
    const user = userEvent.setup()
    renderFlow()

    fireEvent.change(slider(), { target: { value: '1' } })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('heading', { name: 'O que você está sentindo?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ansiedade' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'alegria' })).not.toBeInTheDocument()
  })

  it('walks through emotions and context, saves them and sums everything up', async () => {
    const user = userEvent.setup()
    const save = renderFlow()

    fireEvent.change(slider(), { target: { value: '1' } })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'ansiedade' }))
    await user.click(screen.getByRole('button', { name: 'Continuar com 1' }))
    await user.click(screen.getByRole('button', { name: 'trabalho' }))
    await user.type(screen.getByRole('textbox', { name: 'Nota sobre hoje' }), 'Prazo apertado')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('mal · ansiedade · trabalho')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith({
      moodLevel: 1,
      emotions: ['anxiety'],
      contexts: ['work'],
      note: 'Prazo apertado',
    })
    expect(screen.getByRole('link', { name: 'Ver meus dias' })).toHaveAttribute('href', '/today')
  })

  it('stores words the person typed as they were written', async () => {
    const user = userEvent.setup()
    const save = renderFlow()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar ou escrever outra' }),
      'luto{Enter}',
    )
    await user.click(screen.getByRole('button', { name: 'Continuar com 1' }))
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('neutro · luto')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith({
      moodLevel: 3,
      emotions: ['luto'],
      contexts: [],
      note: null,
    })
  })

  it('walks the whole check-in in American English', async () => {
    const user = userEvent.setup()
    const save = renderFlow(jest.fn<Save>(savedAs), 'en-US')
    const question = 'How are you feeling right now?'

    fireEvent.change(slider(question), { target: { value: '1' } })
    expect(slider(question)).toHaveAttribute('aria-valuetext', 'Bad')

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: 'What are you feeling?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'worry' }))
    await user.click(screen.getByRole('button', { name: 'Continue with 1' }))
    await user.click(screen.getByRole('tab', { name: 'people' }))
    await user.click(screen.getByRole('button', { name: 'coworkers' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: 'Logged at 09:05 AM.' })).toBeInTheDocument()
    expect(screen.getByText('bad · worry · coworkers')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith({
      moodLevel: 1,
      emotions: ['worry'],
      contexts: ['coworkers'],
      note: null,
    })
  })

  it('goes back without losing the choices', async () => {
    const user = userEvent.setup()
    renderFlow()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'tédio' }))
    await user.click(screen.getByRole('button', { name: 'Pular' }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByRole('button', { name: 'tédio' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the person on the step when saving fails', async () => {
    const user = userEvent.setup()
    renderFlow(
      jest.fn<Save>().mockResolvedValue({ ok: false, error: 'Não conseguimos registrar agora.' }),
    )

    await user.click(screen.getByRole('button', { name: 'Registrar só o humor' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos registrar agora.')
    expect(slider()).toBeInTheDocument()
  })
})
