import Image from 'next/image'
import { cn } from '@/shared/lib/utils'

const sizes = {
  xs: { pixels: 28, className: 'size-7 text-[11px]' },
  sm: { pixels: 32, className: 'size-8 text-[12px]' },
  md: { pixels: 40, className: 'size-10 text-sm' },
  lg: { pixels: 56, className: 'size-14 text-[19px]' },
  xl: { pixels: 80, className: 'size-20 text-[28px]' },
} as const

export type AvatarSize = keyof typeof sizes

interface AvatarProps {
  src: string | null
  initials: string
  size: AvatarSize
  alt?: string
  eager?: boolean
  className?: string
}

export function Avatar({ src, initials, size, alt = '', eager = false, className }: AvatarProps) {
  const { pixels, className: sizeClass } = sizes[size]
  if (src === null) {
    return (
      <span
        aria-hidden
        className={cn(
          'grid shrink-0 place-items-center rounded-full bg-sage font-serif leading-none text-foreground',
          sizeClass,
          className,
        )}
      >
        {initials}
      </span>
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={pixels}
      height={pixels}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      unoptimized
      className={cn('shrink-0 rounded-full bg-sage object-cover', sizeClass, className)}
    />
  )
}
