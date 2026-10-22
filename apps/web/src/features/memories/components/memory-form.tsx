'use client'

import { memoryLimits } from '@mycogni/domain'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { useAutoGrow } from '@/shared/hooks/use-auto-grow'
import { cn } from '@/shared/lib/utils'
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
  className?: string
  children?: ReactNode
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
  className,
  children,
}: MemoryFormProps) {
  const fieldId = useId()
  const errorId = useId()
  const [content, setContent] = useState(initial)
  const field = useAutoGrow(content)

  useEffect(() => {
    const end = field.current?.value.length ?? 0
    field.current?.setSelectionRange(end, end)
  }, [field])

  return (
    <form
      className={cn('space-y-3', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSave(content)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
    >
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <textarea
        ref={field}
        id={fieldId}
        value={content}
        onChange={(event) => {
          setContent(event.currentTarget.value)
        }}
        placeholder={placeholder}
        maxLength={memoryLimits.content}
        rows={1}
        autoFocus
        aria-invalid={error === null ? undefined : true}
        aria-describedby={error === null ? undefined : errorId}
        className="block w-full resize-none overflow-hidden bg-transparent p-0 text-base leading-relaxed text-pretty outline-none placeholder:text-muted-foreground"
      />
      {children}
      {error !== null && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-1.5">
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
