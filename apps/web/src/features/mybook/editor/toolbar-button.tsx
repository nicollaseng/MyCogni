import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface ToolbarButtonProps {
  label: string
  onPress: () => void
  children: ReactNode
  pressed?: boolean
  expanded?: boolean
  disabled?: boolean
  className?: string
}

export function keepEditorFocus(event: { preventDefault: () => void }): void {
  event.preventDefault()
}

export function ToolbarButton({
  label,
  onPress,
  children,
  pressed,
  expanded,
  disabled = false,
  className,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      disabled={disabled}
      onMouseDown={keepEditorFocus}
      onClick={onPress}
      className={cn(
        'inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] px-2 text-foreground transition-colors duration-150 hover:bg-sage disabled:pointer-events-none disabled:opacity-35 aria-expanded:bg-sage aria-pressed:bg-primary aria-pressed:text-primary-foreground motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function ToolbarGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-0.5', className)}>{children}</div>
}
