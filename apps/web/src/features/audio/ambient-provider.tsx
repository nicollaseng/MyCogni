'use client'

import { ambientLoopAt, type AmbientLoopId, type AmbientSoundId } from '@mycogni/domain'
import { usePathname } from 'next/navigation'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createAmbientEngine, type AmbientEngine } from './ambient-engine'
import { createAmbientSession, type AmbientSession } from './ambient-session'
import { saveAudioPreferences, useAudioPreferences } from './preferences'

export const ambientPreviewMs = 7000

interface AmbientControls {
  session: AmbientSession
  play: (loop: AmbientLoopId | null) => void
  pause: () => void
  preview: (sound: AmbientSoundId) => void
  duck: (ducked: boolean) => void
  hold: (held: boolean) => void
}

export interface AmbientState {
  loop: AmbientLoopId | null
  onZenHome: boolean
  playing: boolean
  toggle: () => void
  preview: (sound: AmbientSoundId) => void
  previewing: AmbientSoundId | null
  duck: (ducked: boolean) => void
  hold: (held: boolean) => void
}

function controlsFor(session: AmbientSession, ambient: AmbientEngine): AmbientControls {
  return {
    session,
    play(loop) {
      saveAudioPreferences({ paused: false })
      void ambient.unlock().then((running) => {
        if (running && loop !== null) {
          ambient.play(loop)
        }
      })
    },
    pause() {
      saveAudioPreferences({ paused: true })
    },
    preview(sound) {
      if (session.snapshot().previewing === sound) {
        session.update({ previewing: null })
        return
      }
      session.update({ previewing: sound })
      void ambient.unlock().then((running) => {
        if (running && sound !== 'none') {
          ambient.play(sound)
        }
      })
    },
    duck(ducked) {
      session.update({ ducks: Math.max(0, session.snapshot().ducks + (ducked ? 1 : -1)) })
    },
    hold(held) {
      session.update({ holds: Math.max(0, session.snapshot().holds + (held ? 1 : -1)) })
    },
  }
}

const silent: AmbientEngine = {
  unlock: () => Promise.resolve(false),
  running: () => false,
  subscribe: () => () => undefined,
  play: () => undefined,
  stop: () => undefined,
  setVolume: () => undefined,
  setDucked: () => undefined,
}

const AmbientContext = createContext<AmbientControls>(
  controlsFor(createAmbientSession('/'), silent),
)

const interactions = ['pointerdown', 'keydown', 'touchend'] as const

function isZenPath(pathname: string): boolean {
  return pathname === '/zen' || pathname.startsWith('/zen/')
}

function hasBeenActive(): boolean {
  return 'userActivation' in navigator && navigator.userActivation.hasBeenActive
}

function useSession(session: AmbientSession) {
  return useSyncExternalStore(session.subscribe, session.snapshot, session.initial)
}

export function useAmbient(): AmbientState {
  const controls = useContext(AmbientContext)
  const { pathname, running, previewing } = useSession(controls.session)
  const { scope, sound, paused } = useAudioPreferences()
  const loop = ambientLoopAt({ scope, sound, onZen: isZenPath(pathname) })
  const playing = running && !paused && loop !== null

  return {
    loop,
    onZenHome: pathname === '/zen',
    playing,
    toggle: () => {
      if (playing) {
        controls.pause()
      } else {
        controls.play(loop)
      }
    },
    preview: controls.preview,
    previewing,
    duck: controls.duck,
    hold: controls.hold,
  }
}

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange)
  return () => {
    document.removeEventListener('visibilitychange', onChange)
  }
}

function useHidden(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === 'hidden',
    () => false,
  )
}

interface AmbientRootProps {
  pathname: string
  children: ReactNode
  engine?: () => AmbientEngine
}

export function AmbientProvider({ children }: { children: ReactNode }) {
  return <AmbientRoot pathname={usePathname()}>{children}</AmbientRoot>
}

export function AmbientRoot({
  pathname,
  children,
  engine = createAmbientEngine,
}: AmbientRootProps) {
  const [ambient] = useState(engine)
  const [controls] = useState(() => controlsFor(createAmbientSession(pathname), ambient))
  const { session } = controls
  const { running, previewing, ducks, holds } = useSession(session)
  const preferences = useAudioPreferences()
  const hidden = useHidden()
  const loop = ambientLoopAt({
    scope: preferences.scope,
    sound: preferences.sound,
    onZen: isZenPath(pathname),
  })
  const previewLoop = previewing === null || previewing === 'none' ? null : previewing
  const target = hidden || holds > 0 ? null : (previewLoop ?? (preferences.paused ? null : loop))

  useEffect(() => {
    session.update({ pathname })
  }, [session, pathname])

  useEffect(
    () =>
      ambient.subscribe(() => {
        session.update({ running: ambient.running() })
      }),
    [ambient, session],
  )

  useEffect(() => {
    if (target === null) {
      ambient.stop()
      return undefined
    }
    if (running) {
      ambient.play(target)
      return undefined
    }
    function start() {
      void ambient.unlock()
    }
    function onInteraction() {
      release()
      start()
    }
    function release() {
      for (const name of interactions) {
        document.removeEventListener(name, onInteraction, true)
      }
    }
    for (const name of interactions) {
      document.addEventListener(name, onInteraction, true)
    }
    if (hasBeenActive()) {
      start()
    }
    return release
  }, [ambient, target, running])

  useEffect(() => {
    ambient.setVolume(preferences.volume)
  }, [ambient, preferences.volume])

  useEffect(() => {
    ambient.setDucked(ducks > 0)
  }, [ambient, ducks])

  useEffect(() => {
    if (previewing === null) {
      return undefined
    }
    const timer = setTimeout(() => {
      session.update({ previewing: null })
    }, ambientPreviewMs)
    return () => {
      clearTimeout(timer)
    }
  }, [session, previewing])

  useEffect(
    () => () => {
      ambient.stop()
    },
    [ambient],
  )

  return <AmbientContext.Provider value={controls}>{children}</AmbientContext.Provider>
}
