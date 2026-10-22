'use client'

import { createContext, useContext } from 'react'

export interface GalleryActions {
  open: (path: string) => void
}

export const GalleryContext = createContext<GalleryActions>({ open: () => undefined })

export function useGalleryActions(): GalleryActions {
  return useContext(GalleryContext)
}
