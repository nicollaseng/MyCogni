import type { ReactNode, Ref } from 'react'
import { cn } from '@/shared/lib/utils'

interface HeaderButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
  outlined?: boolean
  disabled?: boolean
  ref?: Ref<HTMLButtonElement>
}

export const headerButtonStyle =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground motion-reduce:transition-none'

export function HeaderButton({
  label,
  onClick,
  children,
  outlined = false,
  disabled = false,
  ref,
}: HeaderButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) {
          onClick()
        }
      }}
      className={cn(
        headerButtonStyle,
        outlined && 'border border-rule',
        disabled && 'cursor-default opacity-40 hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}
