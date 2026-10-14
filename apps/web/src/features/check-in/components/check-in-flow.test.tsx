import { describe, expect, it } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckInFlow } from './check-in-flow'

function renderFlow() {
  render(<CheckInFlow today="Quarta-feira, 14 de outubro" />)
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

    expect(
      screen.getByRole('heading', { name: /^Registrado às \d{2}:\d{2}\.$/ }),
    ).toBeInTheDocument()
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

  it('walks through emotions and context and sums everything up', async () => {
    const user = userEvent.setup()
    renderFlow()

    fireEvent.change(slider(), { target: { value: '1' } })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'ansiedade' }))
    await user.click(screen.getByRole('button', { name: 'Continuar com 1' }))
    await user.click(screen.getByRole('button', { name: 'trabalho' }))
    await user.type(screen.getByRole('textbox', { name: 'Nota sobre hoje' }), 'Prazo apertado')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(screen.getByText('mal · ansiedade · trabalho')).toBeInTheDocument()
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

  it('tells the person the record is not saved yet', async () => {
    const user = userEvent.setup()
    renderFlow()

    await user.click(screen.getByRole('button', { name: 'Registrar só o humor' }))

    expect(screen.getByText('Nesta versão, o registro ainda não fica salvo.')).toBeInTheDocument()
  })
})
