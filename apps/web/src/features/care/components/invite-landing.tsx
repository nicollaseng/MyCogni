import type { InvitationPreview } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { timeLeft, type ClosedStatus } from '../invitations'
import { SharingSummary } from './sharing-summary'

export function InviteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 sm:px-10">
      <header className="py-6">
        <Wordmark />
      </header>
      <main className="flex flex-1 justify-center py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
      <footer className="py-6">
        <HelpDisclosure />
      </footer>
    </div>
  )
}

function InviteHeading({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <header className="space-y-3">
      <p className="text-sm text-muted-foreground">{kicker}</p>
      <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.02em] text-balance sm:text-[40px]">
        {title}
      </h1>
      <p className="leading-relaxed text-pretty text-muted-foreground">{children}</p>
    </header>
  )
}

interface PendingInviteProps {
  preview: InvitationPreview
  now: Date
  children: ReactNode
}

export function PendingInvite({ preview, now, children }: PendingInviteProps) {
  const t = useTranslations('care.invite')
  const kinds = useTranslations('common.professionalKinds')
  const { name, kind } = preview.professional
  const left = timeLeft(new Date(preview.expiresAt), now)

  return (
    <div className="space-y-8">
      <InviteHeading
        kicker={`${t('kicker')} · ${kinds(kind)}`}
        title={t('pending.title', { name })}
      >
        {t('pending.lead', { name })}
      </InviteHeading>
      <SharingSummary name={name} />
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {left.unit === 'days'
            ? t('pending.expiresInDays', { count: left.count })
            : t('pending.expiresInHours', { count: left.count })}
        </p>
        {children}
      </div>
    </div>
  )
}

function continueHref(code: string, via: 'sign-up' | 'sign-in'): string {
  return `/continue?${new URLSearchParams({ to: `/invite/${code}`, via }).toString()}`
}

export function SignedOutChoices({ code }: { code: string }) {
  const t = useTranslations('care.invite.pending')

  return (
    <div className="space-y-3">
      <a
        href={continueHref(code, 'sign-up')}
        className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
      >
        {t('signUp')}
      </a>
      <a
        href={continueHref(code, 'sign-in')}
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
      >
        {t('signIn')}
      </a>
      <p className="pt-1 text-sm text-pretty text-muted-foreground">{t('signedOutHint')}</p>
    </div>
  )
}

function AppLink({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('care.invite')
  return (
    <Link href={signedIn ? '/today' : '/'} className={buttonVariants({ variant: 'outline' })}>
      {signedIn ? t('goToApp') : t('goHome')}
    </Link>
  )
}

interface ClosedInviteProps {
  status: ClosedStatus
  name: string
  signedIn: boolean
}

export function ClosedInvite({ status, name, signedIn }: ClosedInviteProps) {
  const t = useTranslations('care.invite')

  return (
    <div className="space-y-8">
      <InviteHeading kicker={t('kicker')} title={t(`closed.${status}.title`, { name })}>
        {t(`closed.${status}.body`, { name })}
      </InviteHeading>
      <AppLink signedIn={signedIn} />
    </div>
  )
}

export function UnknownInvite({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('care.invite')

  return (
    <div className="space-y-8">
      <InviteHeading kicker={t('kicker')} title={t('unknown.title')}>
        {t('unknown.body')}
      </InviteHeading>
      <AppLink signedIn={signedIn} />
    </div>
  )
}
