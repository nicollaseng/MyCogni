'use client'

import { usePathname } from 'next/navigation'
import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { isActivePath } from '../navigation'

export function FooterHelp({ pathname }: { pathname: string }) {
  return isActivePath(pathname, '/zen') ? null : <HelpDisclosure />
}

export function CurrentFooterHelp() {
  return <FooterHelp pathname={usePathname()} />
}
