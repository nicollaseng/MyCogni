'use client'

import type {
  AssistantConversationSummary,
  AssistantExchange,
  AssistantMessage,
} from '@mycogni/contracts'
import { useEffect, useState } from 'react'
import { unlessOutdated } from '@/shared/lib/actions/outdated'
import type { AssistantActions, AssistantState, AssistantTarget } from './model'

const pendingId = 'pending'

function summaryOf(
  exchange: AssistantExchange,
  text: string,
  existing: AssistantConversationSummary | undefined,
  target: AssistantTarget,
): AssistantConversationSummary {
  const now = exchange.messages.at(-1)?.createdAt ?? new Date().toISOString()
  return {
    id: exchange.conversationId,
    mode: target.mode,
    risk: exchange.risk,
    preview: existing?.preview ?? text.slice(0, 80),
    entryId: existing?.entryId ?? (target.mode === 'personal' ? (target.entryId ?? null) : null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function useAssistantChat(
  target: AssistantTarget,
  actions: AssistantActions,
  prepare?: () => Promise<unknown>,
) {
  const [state, setState] = useState<AssistantState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const patientId = target.mode === 'professional' ? target.patientId : null

  useEffect(() => {
    let active = true
    void unlessOutdated(() =>
      actions.open(patientId === null ? { mode: 'personal' } : { mode: 'professional', patientId }),
    ).then((result) => {
      if (!active || result === null) {
        return
      }
      if (result.ok) {
        setState(result.value)
      } else {
        setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [actions, patientId])

  function startNew(): void {
    setConversationId(null)
    setMessages([])
    setError(null)
  }

  async function select(id: string): Promise<void> {
    setError(null)
    const result = await unlessOutdated(() => actions.load(id))
    if (result === null) {
      return
    }
    if (result.ok) {
      setConversationId(result.value.id)
      setMessages(result.value.messages)
    } else {
      setError(result.error)
    }
  }

  async function send(text: string): Promise<boolean> {
    const trimmed = text.trim()
    if (trimmed === '' || pending) {
      return false
    }
    setError(null)
    setPending(true)
    const optimistic: AssistantMessage = {
      id: pendingId,
      role: 'user',
      text: trimmed,
      risk: 'none',
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, optimistic])
    await prepare?.()
    const result = await unlessOutdated(() => actions.send(target, conversationId, trimmed))
    setPending(false)
    if (result?.ok !== true) {
      setMessages((current) => current.filter((message) => message.id !== pendingId))
      if (result !== null) {
        setError(result.error)
      }
      return false
    }
    const exchange = result.value
    setConversationId(exchange.conversationId)
    setMessages((current) => [
      ...current.filter((message) => message.id !== pendingId),
      ...exchange.messages,
    ])
    setState((current) => {
      if (current === null) {
        return current
      }
      const others = current.overview.conversations.filter(
        (item) => item.id !== exchange.conversationId,
      )
      const existing = current.overview.conversations.find(
        (item) => item.id === exchange.conversationId,
      )
      return {
        ...current,
        overview: {
          ...current.overview,
          conversations: [summaryOf(exchange, trimmed, existing, target), ...others],
        },
      }
    })
    return true
  }

  async function remove(removed: string): Promise<boolean> {
    const result = await unlessOutdated(() => actions.remove(removed))
    if (result === null) {
      return false
    }
    if (!result.ok) {
      setError(result.error)
      return false
    }
    if (removed === conversationId) {
      startNew()
    }
    setState((current) =>
      current === null
        ? current
        : {
            ...current,
            overview: {
              ...current.overview,
              conversations: current.overview.conversations.filter((item) => item.id !== removed),
            },
          },
    )
    return true
  }

  async function allow(journal: boolean): Promise<boolean> {
    setError(null)
    const result = await unlessOutdated(() => actions.allow(journal))
    if (result === null) {
      return false
    }
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setState((current) =>
      current === null
        ? current
        : { ...current, overview: { ...current.overview, access: { records: true, journal } } },
    )
    return true
  }

  return {
    state,
    loadError,
    conversationId,
    messages,
    pending,
    error,
    startNew,
    select,
    send,
    remove,
    allow,
  }
}

export type AssistantChat = ReturnType<typeof useAssistantChat>
