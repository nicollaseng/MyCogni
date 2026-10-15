'use client'

import { ambientLoopAt, type AmbientLoopId, type AmbientSoundId } from '@mycogni/domain'
import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createAmbientEngine, type AmbientEngine } from './ambient-engine'
import { useAudioPreferences } from './preferences'

export const ambientPreviewMs = 7000

export interface AmbientState {
  loop: AmbientLoopId | null
  playing: boolean
  toggle: () => void
  preview: (sound: AmbientSoundId) => void
  previewing: AmbientSoundId | null
  duck: (ducked: boolean) => void
}

const inactive: AmbientState = {
  loop: null,
  playing: false,
  toggle: () => undefined,
  preview: () => undefined,
  previewing: null,
  duck: () => undefined,
}

const AmbientContext = createContext<AmbientState>(inactive)

export function useAmbient(): AmbientState {
  return useContext(AmbientContext)
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

function isZenPath(pathname: string): boolean {
  return pathname === '/zen' || pathname.startsWith('/zen/')
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
  const preferences = useAudioPreferences()
  const onZen = isZenPath(pathname)
  const hidden = useHidden()
  const [wanted, setWanted] = useState(false)
  const [previewing, setPreviewing] = useState<AmbientSoundId | null>(null)
  const [ducks, setDucks] = useState(0)
  const [ambient] = useState(engine)
  const loop = ambientLoopAt({ scope: preferences.scope, sound: preferences.sound, onZen })
  const previewLoop = previewing === null || previewing === 'none' ? null : previewing
  const target = hidden ? null : (previewLoop ?? (wanted ? loop : null))

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
      setPreviewing(null)
    }, ambientPreviewMs)
    return () => {
      clearTimeout(timer)
    }
  }, [previewing])

  useEffect(
    () => () => {
      ambient.stop()
    },
    [ambient],
  )

  const duck = useCallback(
    (ducked: boolean) => {
      setDucks((count) => Math.max(0, count + (ducked ? 1 : -1)))
    },
    [setDucks],
  )

  function toggle() {
    if (wanted) {
      setWanted(false)
      return
    }
    ambient.unlock()
    if (loop !== null) {
      ambient.play(loop)
    }
    setWanted(true)
  }

  function preview(sound: AmbientSoundId) {
    if (previewing === sound) {
      setPreviewing(null)
      return
    }
    ambient.unlock()
    if (sound !== 'none') {
      ambient.play(sound)
    }
    setPreviewing(sound)
  }

  const state: AmbientState = {
    loop,
    playing: wanted && loop !== null,
    toggle,
    preview,
    previewing,
    duck,
  }

  return <AmbientContext.Provider value={state}>{children}</AmbientContext.Provider>
}
