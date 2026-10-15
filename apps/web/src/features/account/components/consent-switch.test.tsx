import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import type { ConsentKind } from '@mycogni/domain'
import { ConsentSwitch } from './consent-switch'

describe('ConsentSwitch', () => {
  it('turns the AI summaries off and back on', async () => {
    const setConsent = jest.fn<
      (kind: ConsentKind, enabled: boolean) => Promise<ActionResult<string>>
    >(() => Promise.resolve({ ok: true, value: 'ok' }))
    renderWithIntl(<ConsentSwitch kind="ai_processing" enabled setConsent={setConsent} />)
    const control = screen.getByRole('switch', { name: 'Resumos escritos por IA' })

    expect(control).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(setConsent).toHaveBeenLastCalledWith('ai_processing', false)

    await userEvent.click(control)
    expect(setConsent).toHaveBeenLastCalledWith('ai_processing', true)
  })

  it('says when the change could not be saved', async () => {
    renderWithIntl(
      <ConsentSwitch
        kind="assistant_data"
        enabled={false}
        setConsent={() => Promise.resolve({ ok: false, error: 'Não conseguimos salvar agora.' })}
      />,
    )

    await userEvent.click(screen.getByRole('switch', { name: 'Perguntar: ler meus registros' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos salvar agora.')
  })
})
