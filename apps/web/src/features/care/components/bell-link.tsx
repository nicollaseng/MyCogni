import Link from 'next/link'
import { useTranslations } from 'next-intl'

const badgeLimit = 9

export function BellLink({ unread }: { unread: number }) {
  const t = useTranslations('care.bell')

  return (
    <Link
      href="/notifications"
      aria-label={t('label', { count: unread })}
      className="relative -my-2 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
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
          className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] leading-none font-medium text-primary-foreground"
        >
          {unread > badgeLimit ? `${String(badgeLimit)}+` : unread}
        </span>
      )}
    </Link>
  )
}
