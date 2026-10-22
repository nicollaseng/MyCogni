import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/shared/ui/button'

interface DeleteConfirmProps {
  title: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  const t = useTranslations('assistant.history')
  const id = useId()
  const cancel = useRef<HTMLButtonElement>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    cancel.current?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (!deleting) {
        onCancel()
      }
    }
  }

  async function confirm() {
    setDeleting(true)
    await onConfirm()
  }

  return (
    <div
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-10 flex items-end justify-center bg-foreground/10 p-4 sm:items-center dark:bg-black/40"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        className="w-full max-w-sm space-y-4 rounded-[8px] border border-rule bg-background p-5 shadow-[0_8px_28px_rgb(0_0_0/0.12)]"
      >
        <div className="space-y-1.5">
          <h3 id={`${id}-title`} className="font-serif text-[20px] leading-tight">
            {t('deleteTitle')}
          </h3>
          <p id={`${id}-body`} className="text-sm text-pretty break-words text-muted-foreground">
            {t('deleteBody', { title })}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button ref={cancel} size="sm" variant="ghost" disabled={deleting} onClick={onCancel}>
            {t('deleteCancel')}
          </Button>
          <Button
            size="sm"
            className="bg-danger text-background hover:bg-danger/90"
            disabled={deleting}
            onClick={() => void confirm()}
          >
            {t('deleteConfirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
