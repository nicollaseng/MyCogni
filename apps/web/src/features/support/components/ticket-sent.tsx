'use client'

import { supportTicketLabel, type SupportRequesterRole } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { buttonVariants } from '@/shared/ui/button'
import type { SentTicket } from '../form'
import { supportHomeOf, ticketHrefOf } from '../routes'
import { TicketStatus } from './ticket-status'

interface TicketSentProps {
  ticket: SentTicket
  email: string | null
  role: SupportRequesterRole
}

export function TicketSent({ ticket, email, role }: TicketSentProps) {
  const t = useTranslations('support.sent')
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [])

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-3">
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-serif text-[28px] leading-tight tracking-[-0.01em] outline-none"
        >
          {t('title', { ticket: supportTicketLabel(ticket.number) })}
        </h2>
        <p className="text-[15px]">
          <TicketStatus status="pending" />
        </p>
        <p className="leading-relaxed text-pretty text-muted-foreground">
          {email !== null && ticket.emailSent ? t('email', { email }) : t('noEmail')}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href={ticketHrefOf(role, ticket.id)} className={buttonVariants()}>
          {t('view')}
        </Link>
        <Link href={supportHomeOf(role)} className={buttonVariants({ variant: 'outline' })}>
          {t('back')}
        </Link>
      </div>
    </div>
  )
}
