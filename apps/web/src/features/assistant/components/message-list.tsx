import type { AssistantMessage } from '@mycogni/contracts'
import type { AssistantMode } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { needsSupport, paragraphsOf, type SupportContact } from '../model'
import { SupportCard } from './support-card'

interface MessageListProps {
  messages: readonly AssistantMessage[]
  pending: boolean
  mode: AssistantMode
  contacts: readonly SupportContact[]
}

const bubbles = {
  user: 'ml-auto w-fit max-w-[85%] rounded-[8px] bg-surface px-3.5 py-2.5',
  assistant: 'max-w-[92%]',
  notice: 'max-w-[92%] border-l-2 border-help pl-3.5',
} as const

export function MessageList({ messages, pending, mode, contacts }: MessageListProps) {
  const t = useTranslations('assistant')

  return (
    <div role="log" aria-label={t('title')} className="space-y-5">
      {messages.map((message) => (
        <div key={message.id} data-role={message.role} data-risk={message.risk}>
          <div className={cn('space-y-2 text-[15px] leading-relaxed', bubbles[message.role])}>
            <span className="sr-only">
              {t(message.role === 'user' ? 'roles.user' : 'roles.assistant')}:{' '}
            </span>
            {paragraphsOf(message.text).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line text-pretty">
                {paragraph}
              </p>
            ))}
          </div>
          {needsSupport(message, mode) && (
            <div className="pt-3">
              <SupportCard mode={mode} contacts={contacts} intro={false} />
            </div>
          )}
        </div>
      ))}
      {pending && (
        <p role="status" className="text-[15px] text-muted-foreground">
          <span className="motion-safe:animate-pulse">{t('pending')}</span>
        </p>
      )}
    </div>
  )
}
