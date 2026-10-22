import { useEffect } from 'react'

export function useHiddenTabBar(hidden: boolean): void {
  useEffect(() => {
    if (!hidden) {
      return
    }
    const root = document.documentElement
    root.dataset.tabBar = 'hidden'
    return () => {
      delete root.dataset.tabBar
    }
  }, [hidden])
}
