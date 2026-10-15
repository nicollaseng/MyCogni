import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
  }
}

function snapshot(): string {
  return window.location.hash
}

export function useLocationHash(): string {
  return useSyncExternalStore(subscribe, snapshot, () => '')
}
