'use client'

import { useId } from 'react'
import { useModalPanel } from '@/shared/hooks/use-modal-panel'
import { cn } from '@/shared/lib/utils'
import { ClientPortal } from './client-portal'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId()
  const bodyId = useId()
  const { panel, closing, close, onKeyDown } = useModalPanel<HTMLDivElement>(onCancel, 150)

  return (
    <ClientPortal>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-6">
        <div
          ref={panel}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          onKeyDown={(event) => {
            event.stopPropagation()
            onKeyDown(event)
          }}
          className={cn(
            'w-full max-w-sm space-y-5 rounded-[8px] bg-background p-6 text-foreground outline-none transition-[opacity,scale] duration-150 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none',
            closing && 'scale-[0.98] opacity-0',
          )}
        >
          <h2 id={titleId} className="text-[17px] font-medium">
            {title}
          </h2>
          <p id={bodyId} className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {body}
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 cursor-pointer items-center rounded-md border border-rule px-4 text-[15px] hover:bg-sage"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                close()
              }}
              className="inline-flex h-10 cursor-pointer items-center rounded-md bg-danger px-4 text-[15px] font-medium text-background hover:bg-danger/90"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  )
}
