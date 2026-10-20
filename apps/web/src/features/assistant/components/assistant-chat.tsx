'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import type { AssistantActions, AssistantTarget } from '../model'
import { useAssistantChat } from '../use-assistant-chat'
import { ChatComposer } from './chat-composer'
import { ChatToolbar } from './chat-toolbar'
import { ConsentPrompt } from './consent-prompt'
import { MessageList } from './message-list'

export interface AssistantChatProps {
  target: AssistantTarget
  actions: AssistantActions
  timeZone: string
}

const personalStarters = ['mood', 'helps', 'sleep'] as const

const professionalStarters = ['trend', 'contexts', 'screenings'] as const

export function AssistantChat({ target, actions, timeZone }: AssistantChatProps) {
  const t = useTranslations('assistant')
  const chat = useAssistantChat(target, actions)
  const [dismissed, setDismissed] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const mode = target.mode
  const access = chat.state?.overview.access
  const contacts = chat.state?.contacts ?? []
  const showConsent = mode === 'personal' && access?.records === false && !dismissed
  const starters =
    mode === 'personal'
      ? personalStarters.map((key) => t(`starters.personal.${key}`))
      : professionalStarters.map((key) => t(`starters.professional.${key}`))

  useEffect(() => {
    const element = scroller.current
    if (element !== null) {
      element.scrollTop = element.scrollHeight
    }
  }, [chat.messages.length, chat.pending])

  return (
    <div className="flex h-[min(80dvh,46rem)] min-h-0 flex-col sm:h-auto sm:flex-1">
      <div className="px-5 pb-3 sm:px-6">
        <ChatToolbar
          conversations={chat.state?.overview.conversations ?? []}
          current={chat.conversationId}
          timeZone={timeZone}
          onNew={chat.startNew}
          onSelect={(id) => void chat.select(id)}
          onDelete={chat.remove}
        />
      </div>
      <div
        ref={scroller}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-2 pb-5 sm:px-6"
      >
        {chat.loadError !== null && (
          <p role="alert" className="text-sm text-danger">
            {chat.loadError}
          </p>
        )}
        {showConsent && (
          <ConsentPrompt
            onAllow={chat.allow}
            onDismiss={() => {
              setDismissed(true)
            }}
          />
        )}
        {access?.records === false && !showConsent && (
          <p className="text-sm text-pretty text-muted-foreground">
            {mode === 'personal' ? t('noAccess') : t('professionalNoAccess')}
          </p>
        )}
        {chat.state !== null && chat.messages.length === 0 && !chat.pending && (
          <div className="space-y-3">
            <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
              {t(`empty.${mode}`)}
            </p>
            <ul className="space-y-2">
              {starters.map((starter) => (
                <li key={starter}>
                  <button
                    type="button"
                    onClick={() => void chat.send(starter)}
                    className="w-full rounded-[6px] border border-rule px-3.5 py-2.5 text-left text-[15px] transition-colors hover:bg-surface"
                  >
                    {starter}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <MessageList
          messages={chat.messages}
          pending={chat.pending}
          mode={mode}
          contacts={contacts}
        />
      </div>
      <div className="border-t border-rule px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
        <ActionError error={chat.error} />
        <ChatComposer
          pending={chat.pending}
          onSend={chat.send}
          notes={[t('disclaimer.mistakes'), t(`disclaimer.${mode}`)]}
        />
      </div>
    </div>
  )
}
