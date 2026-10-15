'use client'

import type { RegistrationProof } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { DocumentUpload } from './document-upload'

interface DocumentReplaceProps {
  proof: RegistrationProof
  onSent: () => Promise<void>
}

export function DocumentReplace({ proof, onSent }: DocumentReplaceProps) {
  const t = useTranslations('verification.document')
  const panelId = useId()
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open)
        }}
        className="inline-flex items-center gap-1.5 text-sm underline decoration-1 underline-offset-4"
      >
        {t('resend')}
        <Chevron open={open} />
      </button>
      <DisclosurePanel id={panelId} open={open} className="pt-5">
        <DocumentUpload proof={proof} onSent={onSent} />
      </DisclosurePanel>
    </div>
  )
}
