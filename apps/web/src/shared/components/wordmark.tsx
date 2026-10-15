import type { Route } from 'next'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export function Wordmark({ className, href = '/' }: { className?: string; href?: Route }) {
  return (
    <Link
      href={href}
      className={cn(
        'font-serif text-[22px] leading-none font-medium tracking-[-0.02em]',
        className,
      )}
    >
      MyCogniAI
    </Link>
  )
}
