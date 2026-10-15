import type { SupportTicket } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { TicketList } from './ticket-list'

interface SupportSectionProps {
  tickets: readonly SupportTicket[]
  timeZone: string
}

export function SupportSection({ tickets, timeZone }: SupportSectionProps) {
  const t = useTranslations('support.section')

  return (
    <div id="support" className="scroll-mt-8">
      <Section title={t('title')}>
        <p className="text-sm text-pretty text-muted-foreground">{t('description')}</p>
        <Panel>
          <TicketList tickets={tickets} timeZone={timeZone} />
        </Panel>
        <Link
          href="/support/new"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'px-4')}
        >
          {t('new')}
        </Link>
      </Section>
    </div>
  )
}
