import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'font-serif text-[22px] leading-none font-medium tracking-[-0.02em]',
        className,
      )}
    >
      MyCogniAI
    </Link>
  )
}
