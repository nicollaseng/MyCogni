import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnrecognizedActionError } from 'next/dist/client/components/unrecognized-action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ActionError } from './action-error'
import { OutdatedAppNotice } from './outdated-app-notice'

function Switch({ action }: { action: () => Promise<ActionResult<null>> }) {
  const { submit, pending, error } = useSubmit(action, () => undefined)
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          submit()
        }}
      >
        Ativar
      </button>
      <ActionError error={error} />
    </>
  )
}

describe('OutdatedAppNotice', () => {
  it('asks to reload when an action from an older version of the app is refused', async () => {
    renderWithIntl(
      <>
        <Switch action={() => Promise.reject(new UnrecognizedActionError('Not found'))} />
        <OutdatedAppNotice />
      </>,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ativar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O app foi atualizado. Recarregue para continuar.',
    )
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeEnabled()
  })
})
