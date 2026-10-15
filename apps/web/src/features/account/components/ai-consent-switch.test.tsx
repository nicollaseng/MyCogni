import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { AiConsentSwitch } from './ai-consent-switch'

describe('AiConsentSwitch', () => {
  it('turns the AI summaries off and back on', async () => {
    const setAiConsent = jest.fn<(enabled: boolean) => Promise<ActionResult<string>>>(() =>
      Promise.resolve({ ok: true, value: 'ok' }),
    )
    render(<AiConsentSwitch enabled setAiConsent={setAiConsent} />)
    const control = screen.getByRole('switch', { name: 'Resumos escritos por IA' })

    expect(control).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(setAiConsent).toHaveBeenLastCalledWith(false)

    await userEvent.click(control)
    expect(setAiConsent).toHaveBeenLastCalledWith(true)
  })

  it('says when the change could not be saved', async () => {
    render(
      <AiConsentSwitch
        enabled={false}
        setAiConsent={() => Promise.resolve({ ok: false, error: 'Não conseguimos salvar agora.' })}
      />,
    )

    await userEvent.click(screen.getByRole('switch'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos salvar agora.')
  })
})
