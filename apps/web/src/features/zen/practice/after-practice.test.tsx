import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReminderOfferProvider } from '@/features/reminders/components/reminder-offer'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { AfterPractice } from './after-practice'
import type { RememberFeeling } from './record'

const offerTitle = 'Quer um lembrete diário para praticar?'

interface Options {
  sessionId?: string | null | undefined
  offer?: boolean
}

function renderAfter(options: Options = {}) {
  const sessionId = 'sessionId' in options ? options.sessionId : 'session-1'
  const offer = options.offer ?? true
  const remember = jest.fn<RememberFeeling>(() => Promise.resolve(true))
  const accept = jest.fn<(time: string) => Promise<ActionResult<string>>>(() =>
    Promise.resolve({ ok: true, value: '20:00' }),
  )
  renderWithIntl(
    <ReminderOfferProvider offer time="20:00" accept={accept}>
      <AfterPractice
        question="Como você está agora?"
        sessionId={sessionId}
        remember={remember}
        offer={offer}
      />
    </ReminderOfferProvider>,
  )
  return { remember, user: userEvent.setup() }
}

describe('AfterPractice', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('asks how the person feels first and only then offers a reminder in the same place', async () => {
    const { remember, user } = renderAfter()

    expect(screen.getByRole('group', { name: 'Como você está agora?' })).toBeVisible()
    expect(screen.queryByRole('region', { name: offerTitle })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bem' }))

    expect(remember).toHaveBeenCalledWith('session-1', 5)
    expect(await screen.findByRole('region', { name: offerTitle })).toBeVisible()
    expect(screen.queryByRole('group', { name: 'Como você está agora?' })).not.toBeInTheDocument()
  })

  it('moves on to the offer when the person skips the question', async () => {
    const { remember, user } = renderAfter()

    await user.click(screen.getByRole('button', { name: 'Pular' }))

    expect(remember).not.toHaveBeenCalled()
    expect(screen.getByRole('region', { name: offerTitle })).toBeVisible()
  })

  it('keeps the thanks in place when the offer was already answered', async () => {
    window.localStorage.setItem('mycogni.reminderOffer', 'done')
    const { user } = renderAfter()

    await user.click(screen.getByRole('button', { name: 'Bem' }))

    expect(await screen.findByText('Anotado: Bem.')).toBeVisible()
    expect(screen.queryByRole('region', { name: offerTitle })).not.toBeInTheDocument()
  })

  it('waits quietly while the session is saved', () => {
    renderAfter({ sessionId: undefined })
    expect(screen.getByText('Como você está agora?')).toBeVisible()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('goes straight to the offer when there is no session to note the feeling on', () => {
    renderAfter({ sessionId: null })

    expect(screen.queryByRole('group', { name: 'Como você está agora?' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: offerTitle })).toBeVisible()
  })

  it('never offers a reminder where it does not belong, as after a meditation', async () => {
    const { user } = renderAfter({ offer: false })

    await user.click(screen.getByRole('button', { name: 'Pular' }))

    expect(screen.queryByRole('region', { name: offerTitle })).not.toBeInTheDocument()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
})
