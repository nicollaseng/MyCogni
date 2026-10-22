'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { conversationTitle } from '../history'
import type { AssistantActions, AssistantTarget } from '../model'
import { useAssistantChat } from '../use-assistant-chat'
import { useIntroOnce } from '../use-intro-once'
import { ChatComposer } from './chat-composer'
import { ChatHeader } from './chat-header'
import { ChatStart } from './chat-start'
import { ConsentPrompt } from './consent-prompt'
import { ConversationHistory } from './conversation-history'
import { MessageList } from './message-list'

export interface AssistantChatProps {
  target: AssistantTarget
  actions: AssistantActions
  timeZone: string
  titleId: string
  onClose: () => void
  patientName?: string
  prepare?: () => Promise<unknown>
}

type View = 'chat' | 'history'

export function AssistantChat({
  target,
  actions,
  timeZone,
  titleId,
  onClose,
  patientName,
  prepare,
}: AssistantChatProps) {
  const t = useTranslations('assistant')
  const chat = useAssistantChat(target, actions, prepare)
  const [dismissed, setDismissed] = useState(false)
  const [view, setView] = useState<View>('chat')
  const [announcement, setAnnouncement] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const chatView = useRef<HTMLDivElement>(null)
  const historyButton = useRef<HTMLButtonElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<'history' | 'composer' | null>(null)
  const mode = target.mode
  const intro = useIntroOnce(mode === 'personal')
  const access = chat.state?.overview.access
  const contacts = chat.state?.contacts ?? []
  const conversations = chat.state?.overview.conversations ?? []
  const showConsent = mode === 'personal' && access?.records === false && !dismissed
  const pageTarget = target.mode === 'personal' && target.entryId !== undefined
  const current = conversations.find((item) => item.id === chat.conversationId)
  const aboutPage = chat.conversationId === null ? pageTarget : (current?.entryId ?? null) !== null
  const question = chat.messages.find((message) => message.role === 'user')?.text
  const title = conversationTitle(question ?? current?.preview ?? '') ?? t('title')
  const empty = chat.conversationId === null && chat.messages.length === 0
  const context = aboutPage
    ? t('page.context')
    : patientName === undefined
      ? null
      : t('professionalContext', { name: patientName })

  useEffect(() => {
    const element = scroller.current
    if (element !== null) {
      element.scrollTop = element.scrollHeight
    }
  }, [chat.messages.length, chat.pending, view])

  useEffect(() => {
    if (view !== 'chat' || pendingFocus.current === null) {
      return
    }
    focusChat(pendingFocus.current)
    pendingFocus.current = null
  }, [view])

  function focusChat(target: 'history' | 'composer') {
    if (target === 'history') {
      historyButton.current?.focus()
    } else {
      chatView.current?.querySelector('textarea')?.focus()
    }
  }

  function showChat(focus: 'history' | 'composer', heading: string) {
    pendingFocus.current = focus
    setView('chat')
    setAnnouncement(heading)
  }

  function startNew() {
    chat.startNew()
    if (view === 'chat') {
      focusChat('composer')
      setAnnouncement(t('title'))
    } else {
      showChat('composer', t('title'))
    }
  }

  return (
    <div className="relative flex h-[min(86dvh,50rem)] min-h-0 flex-col sm:h-auto sm:flex-1">
      <div ref={chatView} hidden={view !== 'chat'} className="flex min-h-0 flex-1 flex-col">
        <ChatHeader
          titleId={view === 'chat' ? titleId : undefined}
          title={title}
          empty={empty}
          historyButton={historyButton}
          onHistory={() => {
            setView('history')
            setAnnouncement(t('history.title'))
          }}
          onNew={startNew}
          onClose={onClose}
        />
        {context !== null && (
          <p className="truncate px-5 pb-1 text-sm text-muted-foreground sm:px-6">{context}</p>
        )}
        <div
          ref={scroller}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-3 pb-5 sm:px-6"
        >
          {chat.loadError !== null && (
            <p role="alert" className="text-sm text-danger">
              {chat.loadError}
            </p>
          )}
          {showConsent && (
            <ConsentPrompt
              journalByDefault={pageTarget}
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
            <ChatStart
              mode={mode}
              page={pageTarget && chat.conversationId === null}
              intro={intro}
              onAsk={(text) => void chat.send(text)}
            />
          )}
          <MessageList
            messages={chat.messages}
            pending={chat.pending}
            mode={mode}
            contacts={contacts}
            onLeave={onClose}
          />
        </div>
        <div className="border-t border-rule px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
          <ActionError error={view === 'chat' ? chat.error : null} />
          <ChatComposer
            pending={chat.pending}
            onSend={chat.send}
            notes={[t('disclaimer.mistakes'), t(`disclaimer.${mode}`)]}
          />
        </div>
      </div>
      {view === 'history' && (
        <ConversationHistory
          titleId={titleId}
          conversations={conversations}
          current={chat.conversationId}
          timeZone={timeZone}
          error={chat.error}
          backButton={backButton}
          onBack={() => {
            showChat('history', title)
          }}
          onNew={startNew}
          onOpen={(id, heading) => {
            void chat.select(id)
            showChat('composer', heading)
          }}
          onDelete={chat.remove}
        />
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
