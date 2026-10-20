import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeEngine } from '@/test/ambient'
import { renderWithIntl } from '@/test/render'
import { AmbientRoot } from '../ambient-provider'
import { audioPreferencesKey, saveAudioPreferences } from '../preferences'
import { NarrationPlayer } from './narration-player'
import { AmbientControl } from './ambient-control'

function renderAt(pathname: string, engine = fakeEngine()) {
  const view = renderWithIntl(
    <AmbientRoot pathname={pathname} engine={() => engine}>
      <AmbientControl />
      <NarrationPlayer
        sources={[{ voice: 'jessica', url: 'https://storage.test/a.mp3' }]}
        title="Sono e humor"
      />
    </AmbientRoot>,
  )
  return { engine, ...view }
}

function activated(active: boolean) {
  Object.defineProperty(window.navigator, 'userActivation', {
    configurable: true,
    value: { hasBeenActive: active, isActive: false },
  })
}

function stored(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem(audioPreferencesKey) ?? '{}') as Record<
    string,
    unknown
  >
}

function control(name = 'Mar') {
  return screen.getByRole('button', { name: `Som de fundo: ${name}` })
}

describe('AmbientControl', () => {
  beforeEach(() => {
    activated(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
    Reflect.deleteProperty(window.navigator, 'userActivation')
  })

  it('starts the sea on arrival in the Zen Space, low and looping', async () => {
    const { engine } = renderAt('/zen/topics/anxiety')

    await waitFor(() => {
      expect(control()).toHaveAttribute('aria-pressed', 'true')
    })
    expect(engine.unlock).toHaveBeenCalled()
    expect(engine.setVolume).toHaveBeenCalledWith(0.12)
    expect(engine.play).toHaveBeenCalledWith('sea')
  })

  it('leaves the control to the hero on the Zen home while the sound still starts', async () => {
    const { engine } = renderAt('/zen')

    await waitFor(() => {
      expect(engine.play).toHaveBeenCalledWith('sea')
    })
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()
  })

  it('waits for the first touch or key when the browser keeps the sound suspended', async () => {
    const engine = fakeEngine({ allowed: false })
    renderAt('/zen/tracks/sleep-and-rest', engine)

    await waitFor(() => {
      expect(engine.unlock).toHaveBeenCalled()
    })
    expect(control()).toHaveAttribute('aria-pressed', 'false')
    expect(engine.play).not.toHaveBeenCalled()

    engine.allow()
    await act(async () => {
      fireEvent.pointerDown(document.body)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(control()).toHaveAttribute('aria-pressed', 'true')
    })
    expect(engine.play).toHaveBeenCalledWith('sea')
  })

  it('does not try to start before any interaction with the page', async () => {
    activated(false)
    const { engine } = renderAt('/zen')

    expect(engine.unlock).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Tab' })
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(engine.play).toHaveBeenCalledWith('sea')
    })
  })

  it('remembers a pause on this device and plays again only when asked', async () => {
    const user = userEvent.setup()
    const { engine, unmount } = renderAt('/zen/topics/anxiety')
    await waitFor(() => {
      expect(control()).toHaveAttribute('aria-pressed', 'true')
    })

    engine.stop.mockClear()
    await user.click(control())

    expect(stored()).toMatchObject({ paused: true })
    expect(engine.stop).toHaveBeenCalled()
    expect(control()).toHaveAttribute('aria-pressed', 'false')
    unmount()

    const next = fakeEngine()
    renderAt('/zen/topics/anxiety', next)
    await act(async () => {
      await Promise.resolve()
    })
    expect(next.play).not.toHaveBeenCalled()
    expect(control()).toHaveAttribute('aria-pressed', 'false')

    await user.click(control())

    expect(stored()).toMatchObject({ paused: false })
    await waitFor(() => {
      expect(next.play).toHaveBeenCalledWith('sea')
    })
    expect(control()).toHaveAttribute('aria-pressed', 'true')
  })

  it('plays across the app when the person chose the whole app', async () => {
    const { engine, unmount } = renderAt('/today')
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()
    expect(engine.play).not.toHaveBeenCalled()
    unmount()

    saveAudioPreferences({ scope: 'app', sound: 'rain' })
    const app = fakeEngine()
    renderAt('/today', app)

    await waitFor(() => {
      expect(control('Chuva')).toHaveAttribute('aria-pressed', 'true')
    })
    expect(app.play).toHaveBeenCalledWith('rain')
  })

  it('names the chosen sound in the control', () => {
    saveAudioPreferences({ sound: 'owl' })
    renderAt('/zen/articles/worry-time')

    expect(control('Coruja')).toHaveTextContent('Coruja')
  })

  it('never starts when the background sound is off or set to none', async () => {
    saveAudioPreferences({ scope: 'off' })
    const off = renderAt('/zen/topics/anxiety')
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()
    expect(off.engine.unlock).not.toHaveBeenCalled()
    expect(off.engine.play).not.toHaveBeenCalled()
    off.unmount()

    saveAudioPreferences({ scope: 'zen', sound: 'none' })
    const none = renderAt('/zen/topics/anxiety')
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.queryByRole('button', { name: /Som de fundo/ })).not.toBeInTheDocument()
    expect(none.engine.unlock).not.toHaveBeenCalled()
    expect(none.engine.play).not.toHaveBeenCalled()
  })

  it('lowers the background while the narration plays and brings it back after', async () => {
    const user = userEvent.setup()
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const { engine, container } = renderAt('/zen/articles/sleep-and-mood')
    await waitFor(() => {
      expect(control()).toHaveAttribute('aria-pressed', 'true')
    })
    const audio = container.querySelector('audio')
    if (audio === null) {
      throw new Error('The player has no audio element')
    }

    await user.click(screen.getByRole('button', { name: 'Ouvir: Sono e humor' }))
    fireEvent.play(audio)

    expect(engine.setDucked).toHaveBeenLastCalledWith(true)

    fireEvent.pause(audio)

    expect(engine.setDucked).toHaveBeenLastCalledWith(false)
  })

  it('stops when the tab is hidden and comes back when it is visible again', async () => {
    const { engine } = renderAt('/zen')
    await waitFor(() => {
      expect(engine.play).toHaveBeenCalledWith('sea')
    })
    const visibility = jest.spyOn(document, 'visibilityState', 'get')
    engine.stop.mockClear()

    visibility.mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(engine.stop).toHaveBeenCalled()

    engine.play.mockClear()
    visibility.mockReturnValue('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(engine.play).toHaveBeenCalledWith('sea')
  })
})
