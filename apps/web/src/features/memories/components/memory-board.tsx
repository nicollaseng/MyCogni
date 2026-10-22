'use client'

import type { Memory } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { Panel } from '@/shared/components/section'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import type { ShownMemory } from '../shown-memory'
import { MemoryForm } from './memory-form'
import { MemoryItem } from './memory-item'

export interface MemoryActions {
  add: (content: string) => Promise<ActionResult<Memory>>
  edit: (id: string, content: string) => Promise<ActionResult<Memory>>
  remove: (id: string) => Promise<ActionResult<null>>
  clear: () => Promise<ActionResult<null>>
}

interface MemoryBoardProps {
  initial: readonly ShownMemory[]
  actions: MemoryActions
}

export function MemoryBoard({ initial, actions }: MemoryBoardProps) {
  const t = useTranslations('memories')
  const [memories, setMemories] = useState<readonly ShownMemory[]>(initial)
  const [adding, setAdding] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const active = memories.filter((memory) => memory.status === 'active')
  const archived = memories.filter((memory) => memory.status === 'archived')

  const add = useSubmit(actions.add, (memory: Memory) => {
    setMemories((current) => [
      { id: memory.id, content: memory.content, status: memory.status, hint: t('source.manual') },
      ...current,
    ])
    setAdding(false)
    setNotice(t('feedback.added'))
  })
  const clear = useSubmit(actions.clear, () => {
    setMemories([])
    setNotice(t('feedback.cleared'))
  })

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
        status: result.value.status,
        hint: shown?.hint ?? null,
      },
    }
  }

  function list(items: readonly ShownMemory[], label: string) {
    return (
      <Panel className="py-1">
        <ul aria-label={label}>
          {items.map((memory) => (
            <MemoryItem
              key={memory.id}
              memory={memory}
              edit={edit}
              remove={actions.remove}
              onEdited={(saved) => {
                setMemories((current) =>
                  current.map((memory) => (memory.id === saved.id ? saved : memory)),
                )
                setNotice(t('feedback.updated'))
              }}
              onRemoved={(id) => {
                setMemories((current) => current.filter((memory) => memory.id !== id))
                setNotice(t('feedback.removed'))
              }}
            />
          ))}
        </ul>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      {adding ? (
        <Panel className="py-4">
          <MemoryForm
            label={t('add.label')}
            placeholder={t('add.placeholder')}
            saveLabel={t('add.save')}
            cancelLabel={t('add.cancel')}
            pending={add.pending}
            error={add.error}
            onSave={add.submit}
            onCancel={() => {
              setAdding(false)
            }}
          />
        </Panel>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNotice(null)
            setAdding(true)
          }}
        >
          {t('add.open')}
        </Button>
      )}
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        list(active, t('saved'))
      )}
      {archived.length > 0 && (
        <details className="space-y-3">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            {t('archived')}
          </summary>
          {list(archived, t('archived'))}
        </details>
      )}
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {notice ?? clear.error}
      </p>
      {memories.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          disabled={clear.pending}
          onClick={() => {
            setConfirming(true)
          }}
          className="-ml-1 px-1 text-danger hover:text-danger"
        >
          {t('clear.open')}
        </Button>
      )}
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
            clear.submit()
          }}
        />
      )}
    </div>
  )
}
