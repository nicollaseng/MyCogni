import type { AssistantConversationSummary } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Chevron } from '@/shared/components/disclosure'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import { formatShortDate, formatTime } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { menuItemStyle, menuSurface } from '@/shared/ui/menu'

interface ChatToolbarProps {
  conversations: readonly AssistantConversationSummary[]
  current: string | null
  timeZone: string
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: () => Promise<boolean>
}

const toolStyle =
  'inline-flex h-9 items-center gap-1.5 rounded-[6px] px-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50'

function History({
  conversations,
  current,
  timeZone,
  onSelect,
}: Pick<ChatToolbarProps, 'conversations' | 'current' | 'timeZone' | 'onSelect'>) {
  const t = useTranslations('assistant.toolbar')
  const locale = useLocale()
  const { open, mounted, closing, close, triggerProps, panelProps } = usePopoverMenu()

  return (
    <div className="relative">
      <button {...triggerProps} className={toolStyle}>
        {t('history')}
        <Chevron open={open} className="size-3.5" />
      </button>
      {mounted && (
        <div
          {...panelProps}
          role="menu"
          aria-label={t('history')}
          className={cn(
            menuSurface,
            'absolute top-full left-0 mt-1 max-h-72 w-72 max-w-[calc(100vw-2.5rem)] origin-top-left overflow-y-auto p-1.5 starting:scale-[0.98] starting:opacity-0',
            closing && 'pointer-events-none scale-[0.98] opacity-0',
          )}
        >
          {conversations.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">{t('historyEmpty')}</p>
          ) : (
            conversations.map((conversation) => {
              const at = new Date(conversation.updatedAt)
              return (
                <button
                  key={conversation.id}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-current={conversation.id === current ? 'true' : undefined}
                  onClick={() => {
                    close(true)
                    onSelect(conversation.id)
                  }}
                  className={cn(
                    menuItemStyle,
                    'flex-col items-start gap-0.5 aria-current:font-medium',
                  )}
                >
                  <span className="line-clamp-1 w-full">
                    {conversation.preview === '' ? t('untitled') : conversation.preview}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">
                    {formatShortDate(at, timeZone, locale)} · {formatTime(at, timeZone, locale)}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function ChatToolbar({
  conversations,
  current,
  timeZone,
  onNew,
  onSelect,
  onDelete,
}: ChatToolbarProps) {
  const t = useTranslations('assistant.toolbar')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className="space-y-2">
      <div className="-ml-2.5 flex flex-wrap items-center gap-1">
        <button
          type="button"
          className={toolStyle}
          onClick={() => {
            setConfirming(false)
            onNew()
          }}
        >
          {t('new')}
        </button>
        <History
          conversations={conversations}
          current={current}
          timeZone={timeZone}
          onSelect={(id) => {
            setConfirming(false)
            onSelect(id)
          }}
        />
        {current !== null && (
          <button
            type="button"
            className={toolStyle}
            aria-expanded={confirming}
            onClick={() => {
              setConfirming(!confirming)
            }}
          >
            {t('delete')}
          </button>
        )}
      </div>
      {confirming && current !== null && (
        <div
          role="group"
          aria-label={t('deleteQuestion')}
          className="space-y-2 rounded-[8px] bg-surface px-4 py-3"
        >
          <p className="text-sm">{t('deleteQuestion')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-danger text-background hover:bg-danger/90"
              disabled={deleting}
              onClick={() => void confirm()}
            >
              {t('deleteConfirm')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={deleting}
              onClick={() => {
                setConfirming(false)
              }}
            >
              {t('deleteCancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
