import type { Route } from 'next'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import { BrandMark } from './brand-mark'

export function Wordmark({ className, href = '/' }: { className?: string; href?: Route }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 font-serif text-[22px] leading-none font-medium tracking-[-0.02em]',
        className,
      )}
    >
      <BrandMark className="size-[1.05em]" />
      <span>MyCogniAI</span>
    </Link>
  )
}
