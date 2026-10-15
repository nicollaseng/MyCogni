import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { JournalInsightsSwitch } from './journal-insights-switch'

describe('JournalInsightsSwitch', () => {
  it('says what turning it on means and saves each change', async () => {
    const save = jest.fn<(enabled: boolean) => Promise<ActionResult<string>>>(() =>
      Promise.resolve({ ok: true, value: 'ok' }),
    )
    renderWithIntl(<JournalInsightsSwitch enabled={false} setJournalInInsights={save} />)
    const control = screen.getByRole('switch', { name: 'Incluir o MyBook nos meus resumos' })

    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(control).toHaveAccessibleDescription(
      'Ligado, o texto das páginas do MyBook escritas no período também é lido para escrever o seu resumo; os resumos para o profissional nunca usam o MyBook.',
    )

    await userEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(save).toHaveBeenLastCalledWith(true)

    await userEvent.click(control)
    expect(control).toHaveAttribute('aria-checked', 'false')
    expect(save).toHaveBeenLastCalledWith(false)
  })

  it('goes back and explains when the change could not be saved', async () => {
    renderWithIntl(
      <JournalInsightsSwitch
        enabled
        setJournalInInsights={() =>
          Promise.resolve({ ok: false, error: 'Não conseguimos salvar agora.' })
        }
      />,
    )
    const control = screen.getByRole('switch')

    await userEvent.click(control)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos salvar agora.')
    expect(control).toHaveAttribute('aria-checked', 'true')
  })

  it('speaks English', () => {
    renderWithIntl(
      <JournalInsightsSwitch
        enabled
        setJournalInInsights={jest.fn<() => Promise<ActionResult<string>>>()}
      />,
      {
        locale: 'en-GB',
      },
    )

    expect(screen.getByRole('switch', { name: 'Include MyBook in my summaries' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })
})
