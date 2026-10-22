import type { ComponentProps, Ref } from 'react'
import { cn } from '@/shared/lib/utils'

type Tone = 'neutral' | 'accent' | 'ghost'

interface RoundButtonProps extends Omit<ComponentProps<'button'>, 'aria-label'> {
  label: string
  tone?: Tone
  ref?: Ref<HTMLButtonElement>
}

const tones: Record<Tone, string> = {
  neutral: 'bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]',
  accent: 'bg-primary text-primary-foreground hover:bg-primary/90',
  ghost: 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
}

export function RoundButton({
  label,
  tone = 'neutral',
  type = 'button',
  className,
  ...props
}: RoundButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 after:absolute after:-inset-1.5 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
