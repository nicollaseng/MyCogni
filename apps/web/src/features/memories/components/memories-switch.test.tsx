import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { MemoriesSwitch } from './memories-switch'

describe('MemoriesSwitch', () => {
  it('turns the memories off and on and says what changed', async () => {
    const save = jest.fn<(enabled: boolean) => Promise<ActionResult<string>>>((enabled) =>
      Promise.resolve({ ok: true, value: enabled ? 'Ligado.' : 'Desligado.' }),
    )
    renderWithIntl(<MemoriesSwitch enabled setMemoriesEnabled={save} />)
    const control = screen.getByRole('switch', { name: 'Lembrar do que eu conto' })

    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(control).toHaveAccessibleDescription('Ligado, o Cogni aprende com o que você escreve.')

    await userEvent.click(control)
    expect(save).toHaveBeenLastCalledWith(false)
    expect(await screen.findByRole('status')).toHaveTextContent('Desligado.')
    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(control).toHaveAccessibleDescription(
      'Desligado, o Cogni não guarda nada novo. O que já está aqui continua.',
    )
  })

  it('goes back when the change could not be saved', async () => {
    renderWithIntl(
      <MemoriesSwitch
        enabled={false}
        setMemoriesEnabled={() => Promise.resolve({ ok: false, error: 'Tente de novo.' })}
      />,
    )
    const control = screen.getByRole('switch')

    await userEvent.click(control)

    expect(await screen.findByRole('alert')).toHaveTextContent('Tente de novo.')
    expect(control).toHaveAttribute('aria-checked', 'false')
  })

  it('speaks English', () => {
    renderWithIntl(
      <MemoriesSwitch
        enabled
        setMemoriesEnabled={jest.fn<() => Promise<ActionResult<string>>>()}
      />,
      { locale: 'en-US' },
    )

    expect(screen.getByRole('switch', { name: 'Remember what I share' })).toBeInTheDocument()
  })
})
