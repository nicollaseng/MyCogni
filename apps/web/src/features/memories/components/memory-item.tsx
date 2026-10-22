'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import type { ShownMemory } from '../shown-memory'
import { MemoryForm } from './memory-form'

const textButton =
  'inline-flex h-9 cursor-pointer items-center rounded-md px-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none'

interface MemoryItemProps {
  memory: ShownMemory
  edit: (id: string, content: string) => Promise<ActionResult<ShownMemory>>
  remove: (id: string) => Promise<ActionResult<null>>
  onEdited: (memory: ShownMemory) => void
  onRemoved: (id: string) => void
}

export function MemoryItem({ memory, edit, remove, onEdited, onRemoved }: MemoryItemProps) {
  const t = useTranslations('memories.item')
  const [editing, setEditing] = useState(false)
  const saving = useSubmit(
    (content: string) => edit(memory.id, content),
    (saved: ShownMemory) => {
      setEditing(false)
      onEdited(saved)
    },
  )
  const removing = useSubmit(
    () => remove(memory.id),
    () => {
      onRemoved(memory.id)
    },
  )

  if (editing) {
    return (
      <li className="py-3">
        <MemoryForm
          label={t('label')}
          initial={memory.content}
          saveLabel={t('save')}
          cancelLabel={t('cancel')}
          pending={saving.pending}
          error={saving.error}
          onSave={saving.submit}
          onCancel={() => {
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-[15px] leading-relaxed text-pretty">{memory.content}</p>
        {memory.hint !== null && <p className="text-[13px] text-muted-foreground">{memory.hint}</p>}
        {removing.error !== null && (
          <p role="alert" className="text-sm text-danger">
            {removing.error}
          </p>
        )}
      </div>
      <div className="-ml-2 flex shrink-0 gap-1 sm:-mr-2 sm:ml-0">
        <button
          type="button"
          onClick={() => {
            setEditing(true)
          }}
          aria-label={`${t('edit')}: ${memory.content}`}
          className={textButton}
        >
          {t('edit')}
        </button>
        <button
          type="button"
          disabled={removing.pending}
          onClick={() => {
            removing.submit()
          }}
          aria-label={`${t('remove')}: ${memory.content}`}
          className={textButton}
        >
          {t('remove')}
        </button>
      </div>
    </li>
  )
}
