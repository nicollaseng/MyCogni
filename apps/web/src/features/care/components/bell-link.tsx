import Link from 'next/link'
import { useTranslations } from 'next-intl'

const badgeLimit = 9

export function BellLink({ unread }: { unread: number }) {
  const t = useTranslations('care.bell')

  return (
    <Link
      href="/notifications"
      aria-label={t('label', { count: unread })}
      className="-my-2 inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[22px]"
      >
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
        <path d="M10 21a2.2 2.2 0 0 0 4 0" />
      </svg>
      {unread > 0 && (
        <span
          aria-hidden
          className="flex items-center gap-1 text-xs font-medium text-foreground tabular-nums"
        >
          <span className="size-1.5 rounded-full bg-emphasis" />
          {unread > badgeLimit ? `${String(badgeLimit)}+` : unread}
        </span>
      )}
    </Link>
  )
}
