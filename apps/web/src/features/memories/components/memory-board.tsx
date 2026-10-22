'use client'

import type { Memory } from '@mycogni/contracts'
import type { MemoryKind } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SettingsPage } from '@/features/account/components/settings-page'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Chevron } from '@/shared/components/disclosure'
import { PlusIcon } from '@/shared/components/icons'
import { MoreMenu } from '@/shared/components/more-menu'
import { Panel } from '@/shared/components/section'
import { ToastRegion, UndoToast } from '@/shared/components/undo-toast'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { iconButtonStyle } from '@/shared/ui/icon-button'
import { forgetMemory } from '../forget'
import { groupMemories } from '../memory-groups'
import type { ShownMemory } from '../shown-memory'
import { useDeferredRemoval, type Removal } from '../use-deferred-removal'
import { MemoryComposer } from './memory-composer'
import { MemoryItem } from './memory-item'

export const undoWindow = 5000

const highlightTime = 1600

export interface MemoryActions {
  add: (content: string, kind: MemoryKind) => Promise<ActionResult<Memory>>
  edit: (id: string, content: string) => Promise<ActionResult<Memory>>
  remove: (id: string) => Promise<ActionResult<null>>
  clear: () => Promise<ActionResult<null>>
}

interface MemoryBoardProps {
  title: string
  intro?: ReactNode
  initial: readonly ShownMemory[]
  actions: MemoryActions
  forget?: (id: string) => Promise<boolean>
}

type FocusTarget = { memory: string } | 'add' | null

function restored(memories: readonly ShownMemory[], { memory, index }: Removal): ShownMemory[] {
  return [...memories.slice(0, index), memory, ...memories.slice(index)]
}

export function MemoryBoard({
  title,
  intro,
  initial,
  actions,
  forget = forgetMemory,
}: MemoryBoardProps) {
  const t = useTranslations('memories')
  const [memories, setMemories] = useState<readonly ShownMemory[]>(initial)
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const focusTarget = useRef<FocusTarget>(null)
  const active = memories.filter((memory) => memory.status === 'active')
  const archived = memories.filter((memory) => memory.status === 'archived')

  const removal = useDeferredRemoval({
    remove: actions.remove,
    forget,
    onFailed: (failed, reason) => {
      setMemories((current) => restored(current, failed))
      setError(reason ?? t('feedback.removeError'))
    },
  })

  const add = useSubmit(actions.add, (memory: Memory) => {
    setMemories((current) => [
      {
        id: memory.id,
        content: memory.content,
        kind: memory.kind,
        status: memory.status,
        hint: t('source.manual'),
      },
      ...current,
    ])
    closeComposer()
    setHighlighted(memory.id)
    setNotice(t('feedback.added'))
  })

  const clear = useSubmit(actions.clear, () => {
    setMemories([])
    setNotice(t('feedback.cleared'))
  })

  useEffect(() => {
    const target = focusTarget.current
    if (target === null) {
      return
    }
    focusTarget.current = null
    const trigger =
      target === 'add'
        ? null
        : list.current?.querySelector<HTMLButtonElement>(
            `[data-memory="${target.memory}"] [aria-haspopup="menu"]`,
          )
    ;(trigger ?? addButton.current)?.focus()
  })

  useEffect(() => {
    if (highlighted === null) {
      return undefined
    }
    list.current
      ?.querySelector(`[data-memory="${highlighted}"]`)
      ?.scrollIntoView({ block: 'nearest' })
    const timer = setTimeout(() => {
      setHighlighted(null)
    }, highlightTime)
    return () => {
      clearTimeout(timer)
    }
  }, [highlighted])

  function closeComposer() {
    focusTarget.current = 'add'
    setAdding(false)
  }

  function neighbourOf(id: string): FocusTarget {
    const items = Array.from(list.current?.querySelectorAll<HTMLElement>('[data-memory]') ?? [])
    const index = items.findIndex((item) => item.dataset.memory === id)
    const next = items[index + 1]?.dataset.memory ?? items[index - 1]?.dataset.memory
    return next === undefined ? 'add' : { memory: next }
  }

  function remove(memory: ShownMemory) {
    const index = memories.findIndex((item) => item.id === memory.id)
    if (index === -1) {
      return
    }
    focusTarget.current = neighbourOf(memory.id)
    setError(null)
    setNotice(null)
    setMemories((current) => current.filter((item) => item.id !== memory.id))
    removal.defer({ memory, index })
  }

  function undo() {
    const undone = removal.undo()
    if (undone === null) {
      return
    }
    focusTarget.current = { memory: undone.memory.id }
    setMemories((current) => restored(current, undone))
  }

  async function edit(id: string, content: string): Promise<ActionResult<ShownMemory>> {
    const result = await actions.edit(id, content)
    if (!result.ok) {
      return result
    }
    const shown = memories.find((memory) => memory.id === id)
    return {
      ok: true,
      value: {
        id,
        content: result.value.content,
        kind: result.value.kind,
        status: result.value.status,
        hint: shown?.hint ?? null,
      },
    }
  }

  function items(shown: readonly ShownMemory[], label: string) {
    return (
      <Panel className="px-4 py-2 sm:px-5">
        <ul aria-label={label}>
          {shown.map((memory) => (
            <MemoryItem
              key={memory.id}
              memory={memory}
              highlighted={memory.id === highlighted}
              edit={edit}
              onEdited={(saved) => {
                setMemories((current) =>
                  current.map((item) => (item.id === saved.id ? saved : item)),
                )
                setNotice(t('feedback.updated'))
              }}
              onRemove={remove}
            />
          ))}
        </ul>
      </Panel>
    )
  }

  const header = (
    <>
      <button
        ref={addButton}
        type="button"
        aria-label={t('add.open')}
        onClick={() => {
          setNotice(null)
          setAdding(true)
        }}
        className={iconButtonStyle}
      >
        <PlusIcon className="size-5" />
      </button>
      {memories.length > 0 && (
        <MoreMenu
          label={t('more')}
          actions={[
            {
              label: t('clear.open'),
              destructive: true,
              onSelect: () => {
                setConfirming(true)
              },
            },
          ]}
        />
      )}
    </>
  )

  return (
    <SettingsPage title={title} actions={header}>
      {intro}
      <div ref={list} className="space-y-8">
        {(error ?? clear.error) !== null && (
          <p role="alert" className="text-sm text-danger">
            {error ?? clear.error}
          </p>
        )}
        {adding && (
          <MemoryComposer
            pending={add.pending}
            error={add.error}
            onSave={add.submit}
            onCancel={closeComposer}
          />
        )}
        {active.length === 0 && !adding && (
          <p className="text-[15px] text-muted-foreground">{t('empty')}</p>
        )}
        {groupMemories(active).map((group) => {
          const label = t(`kinds.${group.kind}`)
          return (
            <section key={group.kind} className="space-y-2.5">
              <h2 className="text-sm text-muted-foreground">
                {label} · {group.memories.length}
              </h2>
              {items(group.memories, label)}
            </section>
          )
        })}
        {archived.length > 0 && (
          <details className="group space-y-2.5">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              {t('archived')} · {archived.length}
              <Chevron open={false} className="size-3.5 group-open:rotate-180" />
            </summary>
            {items(archived, t('archived'))}
          </details>
        )}
      </div>
      <ToastRegion>
        {removal.pending === null ? (
          <span className="sr-only">{notice}</span>
        ) : (
          <UndoToast
            key={removal.pending.memory.id}
            message={t('undo.message')}
            undoLabel={t('undo.action')}
            duration={undoWindow}
            onUndo={undo}
            onExpire={removal.commit}
          />
        )}
      </ToastRegion>
      {confirming && (
        <ConfirmDialog
          title={t('clear.title')}
          body={t('clear.body')}
          confirmLabel={t('clear.confirm')}
          cancelLabel={t('clear.cancel')}
          onCancel={() => {
            setConfirming(false)
          }}
          onConfirm={() => {
            removal.commit()
            clear.submit()
          }}
        />
      )}
    </SettingsPage>
  )
}
