'use client'

import { usePathname } from 'next/navigation'
import { NavigationLinks, type NavigationVariant } from './navigation-links'

export function CurrentNavigation({ variant }: { variant: NavigationVariant }) {
  const pathname = usePathname()
  return <NavigationLinks pathname={pathname} variant={variant} />
}
