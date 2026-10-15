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
import { useAudioPreferences } from './preferences'

export const ambientPreviewMs = 7000

interface AmbientControls {
  session: AmbientSession
  start: (loop: AmbientLoopId | null) => void
  stop: () => void
  preview: (sound: AmbientSoundId) => void
  duck: (ducked: boolean) => void
}

export interface AmbientState {
  loop: AmbientLoopId | null
  playing: boolean
  toggle: () => void
  preview: (sound: AmbientSoundId) => void
  previewing: AmbientSoundId | null
  duck: (ducked: boolean) => void
}

function controlsFor(session: AmbientSession, ambient: AmbientEngine): AmbientControls {
  return {
    session,
    start(loop) {
      ambient.unlock()
      if (loop !== null) {
        ambient.play(loop)
      }
      session.update({ wanted: true })
    },
    stop() {
      session.update({ wanted: false })
    },
    preview(sound) {
      if (session.snapshot().previewing === sound) {
        session.update({ previewing: null })
        return
      }
      ambient.unlock()
      if (sound !== 'none') {
        ambient.play(sound)
      }
      session.update({ previewing: sound })
    },
    duck(ducked) {
      session.update({ ducks: Math.max(0, session.snapshot().ducks + (ducked ? 1 : -1)) })
    },
  }
}

const silent: AmbientEngine = {
  unlock: () => undefined,
  play: () => undefined,
  stop: () => undefined,
  setVolume: () => undefined,
  setDucked: () => undefined,
}

const AmbientContext = createContext<AmbientControls>(
  controlsFor(createAmbientSession('/'), silent),
)

function isZenPath(pathname: string): boolean {
  return pathname === '/zen' || pathname.startsWith('/zen/')
}

function useSession(session: AmbientSession) {
  return useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot)
}

export function useAmbient(): AmbientState {
  const controls = useContext(AmbientContext)
  const { pathname, wanted, previewing } = useSession(controls.session)
  const { scope, sound } = useAudioPreferences()
  const loop = ambientLoopAt({ scope, sound, onZen: isZenPath(pathname) })

  return {
    loop,
    playing: wanted && loop !== null,
    toggle: () => {
      if (wanted) {
        controls.stop()
      } else {
        controls.start(loop)
      }
    },
    preview: controls.preview,
    previewing,
    duck: controls.duck,
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
  const { wanted, previewing, ducks } = useSession(session)
  const preferences = useAudioPreferences()
  const hidden = useHidden()
  const loop = ambientLoopAt({
    scope: preferences.scope,
    sound: preferences.sound,
    onZen: isZenPath(pathname),
  })
  const previewLoop = previewing === null || previewing === 'none' ? null : previewing
  const target = hidden ? null : (previewLoop ?? (wanted ? loop : null))

  useEffect(() => {
    session.update({ pathname })
  }, [session, pathname])

  useEffect(() => {
    if (target === null) {
      ambient.stop()
    } else {
      ambient.play(target)
    }
  }, [ambient, target])

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
