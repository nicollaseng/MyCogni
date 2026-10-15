'use client'

import { cn } from '@/shared/lib/utils'

interface SwitchProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
  describedBy?: string
}

export function Switch({ checked, label, onChange, disabled = false, describedBy }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => {
        onChange(!checked)
      }}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 motion-reduce:transition-none',
        checked ? 'bg-primary' : 'bg-rule',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-background transition-transform duration-200 motion-reduce:transition-none',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}
