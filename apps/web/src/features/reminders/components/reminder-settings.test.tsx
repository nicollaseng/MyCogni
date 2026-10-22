import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { ReminderOverview, ReminderSettings as Settings } from '@mycogni/contracts'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActionResult } from '@/shared/lib/actions/result'
import { renderWithIntl } from '@/test/render'
import { ReminderSettings, type ReminderActions } from './reminder-settings'

const off: ReminderOverview = {
  settings: {
    enabled: false,
    time: '20:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    push: false,
    email: true,
  },
  pushKey: 'BPublicKey',
  devices: 0,
}

const realAgent = navigator.userAgent

function actions(): ReminderActions & { save: jest.Mock<ReminderActions['save']> } {
  return {
    save: jest.fn<ReminderActions['save']>((settings: Settings) =>
      Promise.resolve<ActionResult<ReminderOverview>>({ ok: true, value: { ...off, settings } }),
    ),
    registerDevice: jest.fn<ReminderActions['registerDevice']>(),
    forgetDevice: jest.fn<ReminderActions['forgetDevice']>(),
  }
}

function useAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true })
}

describe('ReminderSettings', () => {
  afterEach(() => {
    useAgent(realAgent)
  })

  it('starts off and shows the details once turned on', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ReminderSettings overview={off} actions={actions()} />)
    const toggle = screen.getByRole('switch', { name: 'Lembrete para praticar' })

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByLabelText('Horário')).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByLabelText('Horário')).toHaveValue('20:00')
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(7)
    expect(screen.getByRole('switch', { name: 'Email' })).toHaveAttribute('aria-checked', 'true')
  })

  it('saves the time and the days chosen', async () => {
    const fake = actions()
    const user = userEvent.setup()
    renderWithIntl(
      <ReminderSettings
        overview={{ ...off, settings: { ...off.settings, enabled: true } }}
        actions={fake}
      />,
    )

    const time = screen.getByLabelText('Horário')
    await user.clear(time)
    await user.type(time, '07:30')
    await user.click(screen.getByRole('button', { name: 'Domingo' }))
    await user.click(screen.getByRole('button', { name: 'Sábado' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(fake.save).toHaveBeenCalledWith({
      enabled: true,
      time: '07:30',
      days: [1, 2, 3, 4, 5],
      push: false,
      email: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Lembrete salvo.')
  })

  it('keeps at least one day', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <ReminderSettings
        overview={{ ...off, settings: { ...off.settings, enabled: true, days: [3] } }}
        actions={actions()}
      />,
    )

    const wednesday = screen.getByRole('button', { name: 'Quarta-feira' })
    expect(wednesday).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Sexta-feira' }))
    expect(wednesday).toBeEnabled()
  })

  it('explains how to get notifications on an iPhone', () => {
    useAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1')
    renderWithIntl(
      <ReminderSettings
        overview={{ ...off, settings: { ...off.settings, enabled: true } }}
        actions={actions()}
      />,
    )

    expect(
      screen.getByText(/No iPhone, as notificações chegam com o app na Tela de Início/),
    ).toBeInTheDocument()
  })

  it('says when notifications are not set up on the server yet', async () => {
    const user = userEvent.setup()
    const fake = actions()
    renderWithIntl(
      <ReminderSettings
        overview={{ ...off, pushKey: null, settings: { ...off.settings, enabled: true } }}
        actions={fake}
      />,
      { locale: 'en-US' },
    )
    const channels = screen.getByRole('group', { name: 'How to remind you' })

    await user.click(within(channels).getByRole('switch', { name: 'Notification on this device' }))

    expect(
      await screen.findByText('Notifications aren’t available yet. Email still works.'),
    ).toBeInTheDocument()
    expect(fake.registerDevice).not.toHaveBeenCalled()
  })

  it('shows why saving failed', async () => {
    const user = userEvent.setup()
    const fake = actions()
    fake.save.mockResolvedValue({ ok: false, error: 'Tente de novo.' })
    renderWithIntl(<ReminderSettings overview={off} actions={fake} />)

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Tente de novo.')
  })
})
