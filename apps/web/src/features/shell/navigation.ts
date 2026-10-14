import type { Route } from 'next'

export interface NavigationItem {
  href: Route
  label: string
}

export const navigationItems: readonly NavigationItem[] = [
  { href: '/today', label: 'Hoje' },
  { href: '/entries', label: 'Registros' },
  { href: '/patterns', label: 'Padrões' },
  { href: '/me', label: 'Você' },
]

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
