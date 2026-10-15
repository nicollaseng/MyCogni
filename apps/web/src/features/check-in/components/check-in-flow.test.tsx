import { describe, expect, it, jest } from '@jest/globals'
import type { CheckIn, CreateCheckInInput } from '@mycogni/contracts'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
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

function renderFlow(save = jest.fn<Save>(savedAs)) {
  render(
    <CheckInFlow today="Quarta-feira, 14 de outubro" timeZone="America/Sao_Paulo" save={save} />,
  )
  return save
}

function slider(): HTMLElement {
  return screen.getByRole('slider', { name: 'Como você está agora?' })
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
      emotions: ['ansiedade'],
      contexts: ['trabalho'],
      note: 'Prazo apertado',
    })
    expect(screen.getByRole('link', { name: 'Ver meus dias' })).toHaveAttribute('href', '/today')
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
