import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center font-medium tracking-[-0.005em] whitespace-nowrap transition-[background-color,color,transform] duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-rule hover:bg-sage',
        ghost: 'text-muted-foreground hover:text-foreground',
      },
      size: {
        default: 'h-12 px-6 text-[15px]',
        sm: 'h-10 px-4 text-[15px]',
        lg: 'h-14 px-6 text-base',
      },
      shape: {
        default: 'rounded-md',
        pill: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default',
    },
  },
)

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  shape,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape }), className)}
      {...props}
    />
  )
}
