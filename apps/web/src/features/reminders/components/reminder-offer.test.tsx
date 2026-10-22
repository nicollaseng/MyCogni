import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ReminderOffer, ReminderOfferProvider } from './reminder-offer'

function renderOffer(
  offer: boolean,
  accept = jest.fn<(time: string) => Promise<ActionResult<string>>>(),
) {
  accept.mockImplementation((time) => Promise.resolve({ ok: true, value: time }))
  renderWithIntl(
    <ReminderOfferProvider offer={offer} time="20:00" accept={accept}>
      <ReminderOffer />
    </ReminderOfferProvider>,
  )
  return { accept, user: userEvent.setup() }
}

describe('ReminderOffer', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('stays out of the way without the offer', () => {
    renderOffer(false)
    expect(screen.queryByText('Quer um lembrete diário para praticar?')).not.toBeInTheDocument()
  })

  it('sets a daily reminder at the chosen time', async () => {
    const { accept, user } = renderOffer(true)

    const time = screen.getByLabelText('Horário do lembrete')
    expect(time).toHaveValue('20:00')
    await user.clear(time)
    await user.type(time, '07:15')
    await user.click(screen.getByRole('button', { name: 'Lembrar todo dia' }))

    expect(accept).toHaveBeenCalledWith('07:15')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Combinado. Lembramos você às 07:15.',
    )
    expect(screen.getByRole('link', { name: 'Ajustar lembretes' })).toHaveAttribute(
      'href',
      '/me/reminders',
    )
  })

  it('goes away for good when the person says not now', async () => {
    const { accept, user } = renderOffer(true)

    await user.click(screen.getByRole('button', { name: 'Agora não' }))

    expect(screen.queryByText('Quer um lembrete diário para praticar?')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('mycogni.reminderOffer')).toBe('done')
    expect(accept).not.toHaveBeenCalled()
  })

  it('is not offered again after it was dismissed', () => {
    window.localStorage.setItem('mycogni.reminderOffer', 'done')
    renderOffer(true)

    expect(screen.queryByText('Quer um lembrete diário para praticar?')).not.toBeInTheDocument()
  })

  it('keeps the confirmation after the page stops offering', async () => {
    const accept = jest
      .fn<(time: string) => Promise<ActionResult<string>>>()
      .mockImplementation((time) => Promise.resolve({ ok: true, value: time }))
    const user = userEvent.setup()
    const { rerender } = renderWithIntl(
      <ReminderOfferProvider offer time="20:00" accept={accept}>
        <ReminderOffer />
      </ReminderOfferProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Lembrar todo dia' }))
    await screen.findByRole('status')
    rerender(
      <ReminderOfferProvider offer={false} time="20:00" accept={accept}>
        <ReminderOffer />
      </ReminderOfferProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Combinado. Lembramos você às 20:00.')
  })
})
