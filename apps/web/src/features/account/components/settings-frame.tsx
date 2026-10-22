'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Avatar } from '@/shared/components/avatar'
import { ChevronRightIcon } from '@/shared/components/icons'
import { cn } from '@/shared/lib/utils'
import {
  activeSection,
  settingsGroups,
  settingsHref,
  type SettingsSection,
} from '../settings-sections'

interface SettingsFrameProps {
  name: string
  email: string | null
  photoUrl: string | null
  initials: string
  children: ReactNode
}

function SectionList({ name, email, photoUrl, initials }: Omit<SettingsFrameProps, 'children'>) {
  const t = useTranslations('account')
  const [profile, ...groups] = settingsGroups

  return (
    <div className="space-y-8 lg:hidden">
      <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em]">{t('title')}</h1>
      <nav aria-label={t('nav.label')} className="space-y-4">
        {profile !== undefined && (
          <Link
            href={settingsHref('profile')}
            className="flex items-center gap-4 rounded-lg bg-surface px-4 py-4 transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
          >
            <Avatar src={photoUrl} initials={initials} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-medium">{name}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {email ?? t('nav.profile')}
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        )}
        {groups.map((group) => (
          <ul key={group.join('-')} className="rounded-lg bg-surface px-4 py-1">
            {group.map((section) => (
              <li key={section}>
                <Link
                  href={settingsHref(section)}
                  className="flex min-h-12 items-center justify-between gap-4 py-3 text-[17px]"
                >
                  {t(`nav.${section}`)}
                  <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </div>
  )
}

function SectionNav({ active }: { active: SettingsSection | null }) {
  const t = useTranslations('account.nav')

  return (
    <nav aria-label={t('label')} className="sticky top-8 hidden lg:block">
      <ul className="space-y-4">
        {settingsGroups.map((group) => (
          <li key={group.join('-')}>
            <ul className="space-y-0.5">
              {group.map((section) => (
                <li key={section}>
                  <Link
                    href={settingsHref(section)}
                    aria-current={active === section ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center rounded-[6px] px-3 text-[15px] text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground motion-reduce:transition-none',
                      active === section && 'bg-surface font-medium text-foreground',
                    )}
                  >
                    {t(section)}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function SettingsFrame({ children, ...profile }: SettingsFrameProps) {
  const segment = useSelectedLayoutSegment()
  const home = segment === null

  return (
    <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div className={cn('lg:block', !home && 'hidden')}>
        {home && <SectionList {...profile} />}
        <SectionNav active={activeSection(segment)} />
      </div>
      <div className={cn('min-w-0', home && 'hidden lg:block')}>{children}</div>
    </div>
  )
}
