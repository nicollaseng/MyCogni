import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { soundProgrammes } from '@mycogni/domain'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AmbientRoot } from '@/features/audio/ambient-provider'
import { messagesFor } from '@/i18n/messages'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import type { RecordPractice } from '../practice/record'
import type { FrequencyEngine } from './frequency-engine'
import { cautionKey } from './sound-player'
import { SoundMode } from './sound-mode'

function frequencyEngine() {
  return {
    start: jest.fn<FrequencyEngine['start']>(),
    stop: jest.fn<FrequencyEngine['stop']>(() => Promise.resolve()),
    playing: jest.fn<FrequencyEngine['playing']>(() => false),
  } satisfies FrequencyEngine
}

function advanceTimers(ms: number) {
  jest.advanceTimersByTime(ms)
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

describe('SoundMode', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    })
    Object.defineProperty(window.navigator, 'userActivation', {
      configurable: true,
      value: { hasBeenActive: true, isActive: false },
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    window.localStorage.clear()
    Reflect.deleteProperty(window.navigator, 'userActivation')
    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('plays a programme in one sound at a time, ends with the timer and fades out', async () => {
    const user = userEvent.setup({ advanceTimers })
    const engine = frequencyEngine()
    const ambient = fakeEngine()
    const record = jest.fn<RecordPractice>(() => Promise.resolve('session-1'))
    renderWithIntl(
      <AmbientRoot pathname="/zen" engine={() => ambient}>
        <SoundMode
          programme="calm"
          onClose={() => undefined}
          engine={() => engine}
          record={record}
        />
      </AmbientRoot>,
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(ambient.play).toHaveBeenCalledWith('sea')

    expect(screen.getByRole('dialog', { name: 'Acalmar' })).toBeVisible()
    expect(
      screen.getByText('Use fones de ouvido para o efeito binaural. Volume baixo.'),
    ).toBeVisible()
    expect(screen.getByTestId('sound-caution')).toHaveTextContent('Evite ouvir enquanto dirige')
    await user.click(screen.getByRole('button', { name: '10 min' }))
    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(engine.start).toHaveBeenCalledWith(soundProgrammes.calm, 'binaural')
    expect(ambient.stop).toHaveBeenCalled()
    expect(window.localStorage.getItem(cautionKey)).toBe('seen')
    expect(screen.getByRole('status')).toHaveTextContent('Tocando')
    advance(60_000)
    expect(screen.getByTestId('sound-clock')).toHaveTextContent('9:00')

    ambient.play.mockClear()
    advance(540_000)
    expect(engine.stop).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Pronto.')
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'sound', contentId: 'calm', completed: true }),
    )
    expect(record.mock.calls[0]?.[0].seconds).toBeGreaterThanOrEqual(600)
    await act(async () => {
      await Promise.resolve()
    })
    expect(ambient.play).toHaveBeenCalledWith('sea')
  }, 20_000)

  it('listens without headphones and keeps a stopped programme after a minute', async () => {
    window.localStorage.setItem(cautionKey, 'seen')
    const user = userEvent.setup({ advanceTimers })
    const engine = frequencyEngine()
    const record = jest.fn<RecordPractice>(() => Promise.resolve(null))
    renderWithIntl(
      <SoundMode
        programme="ease"
        onClose={() => undefined}
        engine={() => engine}
        record={record}
      />,
    )

    expect(screen.queryByTestId('sound-caution')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sem fones' }))
    await user.click(screen.getByRole('button', { name: 'Sem fim' }))
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    expect(engine.start).toHaveBeenCalledWith(soundProgrammes.ease, 'isochronic')
    advance(70_000)
    expect(screen.getByTestId('sound-clock')).toHaveTextContent('1:10')
    await user.click(screen.getByRole('button', { name: 'Parar' }))

    expect(engine.stop).toHaveBeenCalledTimes(1)
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'sound', contentId: 'ease', completed: false }),
    )
  }, 20_000)

  it('never claims to treat, cure or reduce depression or anxiety', () => {
    const forbidden =
      /\b(trata|tratar|tratamento|cura|curar|elimina|reduz|treat|treats|treatment|cure|cures|reduce|reduces|depress|ansiedade|anxiety)/iu
    for (const locale of ['pt-BR', 'pt-PT', 'en-US'] as const) {
      const copy = JSON.stringify(messagesFor(locale).zen.sounds)
      expect(copy).not.toMatch(forbidden)
    }
  })
})
