'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Sheet } from '@/shared/components/sheet'
import type { AssistantActions } from '../model'
import { AssistantChat } from './assistant-chat'

interface PatientAssistantProps {
  patientId: string
  name: string
  actions: AssistantActions
  timeZone: string
  triggerClassName?: string
}

export function PatientAssistant({
  patientId,
  name,
  actions,
  timeZone,
  triggerClassName,
}: PatientAssistantProps) {
  const t = useTranslations('assistant')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
        }}
        className={triggerClassName}
      >
        {t('professionalAction')}
      </button>
      {open && (
        <Sheet
          bare
          onClose={() => {
            setOpen(false)
          }}
        >
          {(close, titleId) => (
            <AssistantChat
              target={{ mode: 'professional', patientId }}
              actions={actions}
              timeZone={timeZone}
              titleId={titleId}
              onClose={close}
              patientName={name}
            />
          )}
        </Sheet>
      )}
    </>
  )
}
