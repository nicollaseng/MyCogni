import type { Route } from 'next'

export interface NavigationItem {
  href: Route
  key: 'today' | 'entries' | 'mybook' | 'patterns' | 'zen'
}

export const navigationItems: readonly NavigationItem[] = [
  { href: '/today', key: 'today' },
  { href: '/entries', key: 'entries' },
  { href: '/mybook', key: 'mybook' },
  { href: '/patterns', key: 'patterns' },
  { href: '/zen', key: 'zen' },
]

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
