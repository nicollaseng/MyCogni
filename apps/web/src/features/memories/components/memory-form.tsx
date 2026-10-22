'use client'

import { memoryLimits } from '@mycogni/domain'
import { useId, useState } from 'react'
import { Button } from '@/shared/ui/button'

interface MemoryFormProps {
  label: string
  initial?: string
  placeholder?: string
  saveLabel: string
  cancelLabel: string
  pending: boolean
  error: string | null
  onSave: (content: string) => void
  onCancel: () => void
}

export function MemoryForm({
  label,
  initial = '',
  placeholder,
  saveLabel,
  cancelLabel,
  pending,
  error,
  onSave,
  onCancel,
}: MemoryFormProps) {
  const fieldId = useId()
  const errorId = useId()
  const [content, setContent] = useState(initial)

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(content)
      }}
    >
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <textarea
        id={fieldId}
        value={content}
        onChange={(event) => {
          setContent(event.currentTarget.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
          }
        }}
        placeholder={placeholder}
        maxLength={memoryLimits.content}
        rows={2}
        autoFocus
        aria-invalid={error === null ? undefined : true}
        aria-describedby={error === null ? undefined : errorId}
        className="w-full resize-none rounded-md border border-rule bg-background px-3.5 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-foreground aria-invalid:border-danger"
      />
      {error !== null && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2.5">
        <Button type="submit" size="sm" disabled={pending}>
          {saveLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  )
}
