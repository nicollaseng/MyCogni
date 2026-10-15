'use client'

import { useId, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, className, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={message === undefined ? undefined : messageId}
        className={cn(
          'h-12 w-full rounded-md border border-rule bg-background px-4 text-base transition-colors outline-none placeholder:text-muted-foreground focus:border-foreground aria-invalid:border-danger',
          className,
        )}
        {...props}
      />
      {message !== undefined && (
        <p
          id={messageId}
          className={cn('text-sm', error === undefined ? 'text-muted-foreground' : 'text-danger')}
        >
          {message}
        </p>
      )}
    </div>
  )
}
