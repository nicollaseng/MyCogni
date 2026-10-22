'use client'

import { isMemoryKind, memoryLimits, type MemoryKind } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Panel } from '@/shared/components/section'
import { groupOrder } from '../memory-groups'
import { MemoryForm } from './memory-form'

interface MemoryComposerProps {
  pending: boolean
  error: string | null
  onSave: (content: string, kind: MemoryKind) => void
  onCancel: () => void
}

export function MemoryComposer({ pending, error, onSave, onCancel }: MemoryComposerProps) {
  const t = useTranslations('memories')
  const kindId = useId()
  const [kind, setKind] = useState<MemoryKind>(memoryLimits.defaultKind)

  return (
    <Panel className="px-4 py-4 sm:px-5">
      <MemoryForm
        className="pt-2"
        label={t('add.label')}
        placeholder={t('add.placeholder')}
        saveLabel={t('add.save')}
        cancelLabel={t('add.cancel')}
        pending={pending}
        error={error}
        onSave={(content) => {
          onSave(content, kind)
        }}
        onCancel={onCancel}
      >
        <div className="flex items-center gap-3">
          <label htmlFor={kindId} className="text-sm text-muted-foreground">
            {t('add.kind')}
          </label>
          <select
            id={kindId}
            value={kind}
            onChange={(event) => {
              const next = event.currentTarget.value
              if (isMemoryKind(next)) {
                setKind(next)
              }
            }}
            className="h-9 cursor-pointer rounded-md bg-background px-2 text-base"
          >
            {groupOrder.map((option) => (
              <option key={option} value={option}>
                {t(`kinds.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </MemoryForm>
    </Panel>
  )
}
