import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { failed, noticed, type FormState } from '../form-state'
import { countdownOf, ResendCode } from './resend-code'

type ResendAction = (state: FormState) => Promise<FormState>

const start = 1_800_000_000_000

function renderResend(action: ResendAction, sentAt: number | null, locale?: 'pt-PT') {
  return renderWithIntl(
    <form>
      <ResendCode action={action} sentAt={sentAt} now={start} />
    </form>,
    locale === undefined ? undefined : { locale },
  )
}

describe('ResendCode', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: start })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('waits a minute after the code was sent before offering another one', () => {
    renderResend(jest.fn<ResendAction>(), start)

    expect(screen.getByText('Você pode pedir outro código em 1:00.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar outro código' })).not.toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(45_000)
    })
    expect(screen.getByText('Você pode pedir outro código em 0:15.')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(15_000)
    })
    expect(screen.getByText('Não recebeu?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar outro código' })).toBeInTheDocument()
  })

  it('offers another code right away when the last one is older than a minute', () => {
    renderResend(jest.fn<ResendAction>(), start - 90_000)

    expect(screen.getByRole('button', { name: 'Enviar outro código' })).toBeInTheDocument()
  })

  it('sends another code and starts counting again', async () => {
    const user = userEvent.setup({
      advanceTimers: (delay) => {
        jest.advanceTimersByTime(delay)
      },
    })
    const action = jest.fn<ResendAction>().mockResolvedValue(noticed('Enviamos um novo código.'))
    renderResend(action, null)

    await user.click(screen.getByRole('button', { name: 'Enviar outro código' }))

    expect(action).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Enviamos um novo código.')).toBeInTheDocument()
    expect(screen.getByText('Você pode pedir outro código em 1:00.')).toBeInTheDocument()
  })

  it('keeps the button when sending fails and explains why', async () => {
    const user = userEvent.setup({
      advanceTimers: (delay) => {
        jest.advanceTimersByTime(delay)
      },
    })
    const action = jest
      .fn<ResendAction>()
      .mockResolvedValue(failed('Muitas tentativas. Espere um pouco.'))
    renderResend(action, null)

    await user.click(screen.getByRole('button', { name: 'Enviar outro código' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Muitas tentativas. Espere um pouco.',
    )
    expect(screen.getByRole('button', { name: 'Enviar outro código' })).toBeInTheDocument()
  })

  it('speaks European Portuguese', () => {
    renderResend(jest.fn<ResendAction>(), start, 'pt-PT')
    expect(screen.getByText('Pode pedir outro código daqui a 1:00.')).toBeInTheDocument()
  })

  it('formats the time left as minutes and seconds', () => {
    expect(countdownOf(60_000)).toBe('1:00')
    expect(countdownOf(9_100)).toBe('0:10')
    expect(countdownOf(-5)).toBe('0:00')
  })
})
