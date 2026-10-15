'use client'

import { cn } from '@/shared/lib/utils'

interface SwitchProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, label, onChange, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        onChange(!checked)
      }}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 motion-reduce:transition-none',
        checked ? 'bg-primary' : 'bg-rule',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 size-6 rounded-full bg-background shadow-sm transition-transform duration-200 motion-reduce:transition-none',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
