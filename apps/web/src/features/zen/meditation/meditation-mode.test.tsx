import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AmbientRoot } from '@/features/audio/ambient-provider'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import { zenOverlayDuration } from '../components/zen-overlay'
import type { RecordPractice, RememberFeeling } from '../practice/record'
import { MeditationMode } from './meditation-mode'
import type { MeditationOption } from './options'

function option(pause = 10): MeditationOption {
  return {
    id: 'anxiety',
    topic: 'anxiety',
    title: 'Quando a ansiedade aperta',
    summary: 'Resumo',
    plans: {
      short: [
        { index: 0, pause },
        { index: 1, pause: 3 },
      ],
      long: [
        { index: 0, pause: pause * 2 },
        { index: 1, pause: 20 },
      ],
    },
    minutes: { short: 5, long: 10 },
    voices: [
      {
        voice: 'jessica',
        lines: [
          { index: 0, url: 'https://audio.test/0.mp3', seconds: 4 },
          { index: 1, url: 'https://audio.test/1.mp3', seconds: 4 },
        ],
      },
    ],
  }
}

let time = 0
const play = jest.fn(() => Promise.resolve())
const pause = jest.fn()

function advanceTimers(ms: number) {
  jest.advanceTimersByTime(ms)
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

function audio(): HTMLAudioElement {
  return screen.getByTestId<HTMLAudioElement>('meditation-audio')
}

function Opener({
  value,
  record,
  remember,
}: Partial<Parameters<typeof MeditationMode>[0]> & {
  value: MeditationOption
}) {
  const [open, setOpen] = useState(true)
  return open ? (
    <MeditationMode
      option={value}
      record={record}
      remember={remember}
      onClose={() => {
        setOpen(false)
      }}
    />
  ) : (
    <p>fechado</p>
  )
}

describe('MeditationMode', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    time = 0
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: pause })
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get: () => time,
      set: (value: number) => {
        time = value
      },
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    Reflect.deleteProperty(HTMLMediaElement.prototype, 'play')
    Reflect.deleteProperty(HTMLMediaElement.prototype, 'pause')
    Reflect.deleteProperty(HTMLMediaElement.prototype, 'currentTime')
    Reflect.deleteProperty(window.navigator, 'userActivation')
    window.localStorage.clear()
  })

  it('plays the voice and the silences, skips, ends and asks how the person feels', async () => {
    const user = userEvent.setup({ advanceTimers })
    const record = jest.fn<RecordPractice>(() => Promise.resolve('session-1'))
    const remember = jest.fn<RememberFeeling>(() => Promise.resolve(true))
    renderWithIntl(<Opener value={option()} record={record} remember={remember} />)

    const dialog = screen.getByRole('dialog', { name: 'Quando a ansiedade aperta' })
    expect(dialog.className).toMatch(/fixed inset-0/)
    expect(screen.getByRole('button', { name: '5 min' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('meditation-clock')).toHaveTextContent('0:00de 0:21')
    await user.click(screen.getByRole('button', { name: '10 min' }))
    expect(screen.getByTestId('meditation-clock')).toHaveTextContent('de 0:48')
    await user.click(screen.getByRole('button', { name: '5 min' }))

    await user.click(screen.getByRole('button', { name: 'Começar' }))
    expect(play).toHaveBeenCalledTimes(1)
    expect(audio().getAttribute('src')).toBe('https://audio.test/0.mp3')
    time = 2
    advance(250)
    expect(screen.getByTestId('meditation-clock')).toHaveTextContent('0:02')

    fireEvent.ended(audio())
    advance(250)
    expect(pause).toHaveBeenCalled()
    advance(10_000)
    expect(audio().getAttribute('src')).toBe('https://audio.test/1.mp3')
    expect(play).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Avançar 15 segundos' }))

    expect(screen.getByRole('status')).toHaveTextContent('Pronto.')
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'meditation', contentId: 'anxiety', completed: true }),
    )
    await user.click(await screen.findByRole('button', { name: 'Bem' }))
    expect(remember).toHaveBeenCalledWith('session-1', 5)
    expect(await screen.findByText('Anotado: Bem.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Escrever no MyBook' })).toHaveAttribute(
      'href',
      '/mybook',
    )
  }, 20_000)

  it('keeps a stopped meditation after a minute, and lowers the background sound meanwhile', async () => {
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    })
    const engine = fakeEngine()
    const user = userEvent.setup({ advanceTimers })
    const record = jest.fn<RecordPractice>(() => Promise.resolve('session-2'))
    renderWithIntl(
      <AmbientRoot pathname="/zen" engine={() => engine}>
        <Opener value={option(200)} record={record} remember={() => Promise.resolve(true)} />
      </AmbientRoot>,
    )

    await user.click(screen.getByRole('button', { name: 'Começar' }))
    expect(engine.setDucked).toHaveBeenLastCalledWith(true)
    fireEvent.ended(audio())
    advance(61_000)
    await user.click(screen.getByRole('button', { name: 'Voltar 15 segundos' }))
    await user.keyboard('{Escape}')
    advance(zenOverlayDuration)

    expect(screen.getByText('fechado')).toBeVisible()
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'meditation', completed: false }),
    )
    expect(record.mock.calls[0]?.[0].seconds).toBeGreaterThanOrEqual(60)
    expect(engine.setDucked).toHaveBeenLastCalledWith(false)
  }, 20_000)
})
