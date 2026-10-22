import type { AssistantConversationSummary } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { ArrowBackIcon, ComposeIcon, MoreIcon } from '@/shared/components/icons'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import { cn } from '@/shared/lib/utils'
import { menuItemStyle, menuSurface } from '@/shared/ui/menu'
import { conversationTitle, groupConversations } from '../history'
import { DeleteConfirm } from './delete-confirm'
import { HeaderButton, headerButtonStyle } from './header-button'

interface ConversationHistoryProps {
  titleId: string | undefined
  conversations: readonly AssistantConversationSummary[]
  current: string | null
  timeZone: string
  error: string | null
  backButton: RefObject<HTMLButtonElement | null>
  onBack: () => void
  onNew: () => void
  onOpen: (id: string, title: string) => void
  onDelete: (id: string) => Promise<boolean>
}

interface HistoryRowProps {
  id: string
  title: string
  current: boolean
  onOpen: () => void
  onAskDelete: () => void
}

function HistoryRow({ id, title, current, onOpen, onAskDelete }: HistoryRowProps) {
  const t = useTranslations('assistant.history')
  const { mounted, closing, close, triggerProps, panelProps } = usePopoverMenu()
  const label = t('more', { title })

  return (
    <li className="relative flex items-center rounded-[6px] transition-colors hover:bg-foreground/[0.04] motion-reduce:transition-none">
      <button
        type="button"
        aria-current={current ? 'true' : undefined}
        onClick={onOpen}
        className="min-w-0 flex-1 truncate py-3 pl-3 text-left text-[15px] aria-current:font-medium"
      >
        {title}
      </button>
      <button
        {...triggerProps}
        data-more={id}
        aria-label={label}
        title={label}
        className={headerButtonStyle}
      >
        <MoreIcon className="size-5" />
      </button>
      {mounted && (
        <div
          {...panelProps}
          role="menu"
          aria-label={label}
          className={cn(
            menuSurface,
            'absolute top-full right-1 mt-1 w-44 origin-top-right p-1.5 starting:scale-[0.98] starting:opacity-0',
            closing && 'pointer-events-none scale-[0.98] opacity-0',
          )}
        >
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close(false)
              onAskDelete()
            }}
            className={cn(menuItemStyle, 'text-danger')}
          >
            {t('delete')}
          </button>
        </div>
      )}
    </li>
  )
}

export function ConversationHistory({
  titleId,
  conversations,
  current,
  timeZone,
  error,
  backButton,
  onBack,
  onNew,
  onOpen,
  onDelete,
}: ConversationHistoryProps) {
  const t = useTranslations('assistant')
  const groupId = useId()
  const list = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<string | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)
  const groups = groupConversations(conversations, new Date(), timeZone)

  useEffect(() => {
    if (deleting !== null) {
      return
    }
    const more = restoreFocus.current
    restoreFocus.current = null
    const row =
      more === null ? null : list.current?.querySelector<HTMLButtonElement>(`[data-more="${more}"]`)
    const target = row ?? backButton.current
    target?.focus()
  }, [deleting, backButton])

  function titleOf(conversation: AssistantConversationSummary): string {
    return conversationTitle(conversation.preview) ?? t('history.untitled')
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return
    }
    event.stopPropagation()
    if (!event.defaultPrevented) {
      event.preventDefault()
      onBack()
    }
  }

  function finishDelete(focus: string | null) {
    restoreFocus.current = focus
    setDeleting(null)
  }

  async function confirmDelete(id: string) {
    await onDelete(id)
    finishDelete(null)
  }

  return (
    <>
      <div inert={deleting !== null} onKeyDown={onKeyDown} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 sm:px-4 sm:pt-5">
          <HeaderButton ref={backButton} label={t('history.back')} onClick={onBack}>
            <ArrowBackIcon className="size-5" />
          </HeaderButton>
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate px-1.5 font-serif text-[20px] leading-tight tracking-[-0.01em]"
          >
            {t('history.title')}
          </h2>
          <HeaderButton label={t('header.new')} onClick={onNew}>
            <ComposeIcon className="size-5" />
          </HeaderButton>
        </div>
        <div
          ref={list}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5"
        >
          <ActionError error={error} />
          {groups.length === 0 ? (
            <p className="px-1 text-[15px] text-muted-foreground">{t('history.empty')}</p>
          ) : (
            groups.map(({ group, conversations: items }) => (
              <section key={group} aria-labelledby={`${groupId}-${group}`} className="space-y-2">
                <h3
                  id={`${groupId}-${group}`}
                  className="px-1 text-[13px] font-medium text-muted-foreground"
                >
                  {t(`history.groups.${group}`)}
                </h3>
                <ul className="space-y-0.5 rounded-[8px] bg-surface p-1">
                  {items.map((conversation) => {
                    const title = titleOf(conversation)
                    return (
                      <HistoryRow
                        key={conversation.id}
                        id={conversation.id}
                        title={title}
                        current={conversation.id === current}
                        onOpen={() => {
                          onOpen(conversation.id, title)
                        }}
                        onAskDelete={() => {
                          setDeleting({ id: conversation.id, title })
                        }}
                      />
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
      {deleting !== null && (
        <DeleteConfirm
          title={deleting.title}
          onCancel={() => {
            finishDelete(deleting.id)
          }}
          onConfirm={() => confirmDelete(deleting.id)}
        />
      )}
    </>
  )
}
