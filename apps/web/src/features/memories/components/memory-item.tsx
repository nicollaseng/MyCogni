'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { MoreMenu } from '@/shared/components/more-menu'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import type { ShownMemory } from '../shown-memory'
import { MemoryForm } from './memory-form'

interface MemoryItemProps {
  memory: ShownMemory
  highlighted?: boolean
  edit: (id: string, content: string) => Promise<ActionResult<ShownMemory>>
  onEdited: (memory: ShownMemory) => void
  onRemove: (memory: ShownMemory) => void
}

export function MemoryItem({
  memory,
  highlighted = false,
  edit,
  onEdited,
  onRemove,
}: MemoryItemProps) {
  const t = useTranslations('memories.item')
  const [editing, setEditing] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const returning = useRef(false)
  const saving = useSubmit(
    (content: string) => edit(memory.id, content),
    (saved: ShownMemory) => {
      finish()
      onEdited(saved)
    },
  )

  function finish() {
    returning.current = true
    setEditing(false)
  }

  useEffect(() => {
    if (!editing && returning.current) {
      returning.current = false
      trigger.current?.focus()
    }
  }, [editing])

  return (
    <li
      data-memory={memory.id}
      className={cn(
        '-mx-3 rounded-md px-3 py-2.5 transition-colors duration-700 ease-out motion-reduce:transition-none',
        highlighted && 'bg-emphasis/12 duration-0',
      )}
    >
      {editing ? (
        <MemoryForm
          className="pt-1.5"
          label={t('label')}
          initial={memory.content}
          saveLabel={t('save')}
          cancelLabel={t('cancel')}
          pending={saving.pending}
          error={saving.error}
          onSave={saving.submit}
          onCancel={finish}
        />
      ) : (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1 pt-1.5">
            <p className="text-base leading-relaxed text-pretty break-words">{memory.content}</p>
            {memory.hint !== null && (
              <p className="text-[13px] text-muted-foreground">{memory.hint}</p>
            )}
          </div>
          <MoreMenu
            label={t('options', { content: memory.content })}
            trigger={trigger}
            className="-mr-2"
            actions={[
              {
                label: t('edit'),
                onSelect: () => {
                  setEditing(true)
                },
              },
              {
                label: t('remove'),
                destructive: true,
                onSelect: () => {
                  onRemove(memory)
                },
              },
            ]}
          />
        </div>
      )}
    </li>
  )
}
