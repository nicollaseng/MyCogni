import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type IconName =
  | 'back'
  | 'bullets'
  | 'checklist'
  | 'chevron'
  | 'close'
  | 'dashes'
  | 'download'
  | 'edit'
  | 'forward'
  | 'image'
  | 'indent'
  | 'lock'
  | 'more'
  | 'numbers'
  | 'outdent'
  | 'photo'
  | 'plus'
  | 'search'
  | 'send'
  | 'trash'

const dot = { fill: 'currentColor', stroke: 'none' } as const

const shapes: Readonly<Record<IconName, ReactNode>> = {
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  bullets: (
    <>
      <circle cx="5" cy="7" r="1.7" {...dot} />
      <circle cx="5" cy="12" r="1.7" {...dot} />
      <circle cx="5" cy="17" r="1.7" {...dot} />
      <path d="M9.5 7H20M9.5 12H20M9.5 17H20" />
    </>
  ),
  checklist: (
    <>
      <circle cx="6" cy="7.5" r="2.6" />
      <path d="m4.9 7.6.9.9 1.6-1.8" />
      <circle cx="6" cy="16.5" r="2.6" />
      <path d="M11 7.5h9M11 16.5h9" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  dashes: <path d="M2.5 7h4.5M2.5 12h4.5M2.5 17h4.5M10 7h10M10 12h10M10 17h10" />,
  download: <path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  edit: (
    <>
      <path d="M14.5 6 18 9.5" />
      <path d="M5 19l.9-3.6L15.8 5.5a1.8 1.8 0 0 1 2.6 0l.1.1a1.8 1.8 0 0 1 0 2.6L8.6 18.1z" />
    </>
  ),
  forward: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20.5 15.5-4.5-4.5-8.5 8" />
    </>
  ),
  indent: <path d="M4 5h16M11 10h9M11 14h9M4 19h16M4.5 9.5 7 12l-2.5 2.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.4" {...dot} />
      <circle cx="12" cy="12" r="1.4" {...dot} />
      <circle cx="18" cy="12" r="1.4" {...dot} />
    </>
  ),
  numbers: (
    <>
      <path d="M4 5.5 5.3 5v4.2M3.9 9.2h2.8M4 13.3c.3-.6.9-.9 1.5-.8.7.1 1.1.7.9 1.3-.2.6-2.4 2.3-2.4 2.3h2.6M9.5 7H20M9.5 12H20M9.5 17H20" />
    </>
  ),
  outdent: <path d="M4 5h16M11 10h9M11 14h9M4 19h16M7 9.5 4.5 12 7 14.5" />,
  photo: (
    <>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  send: <path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5" />,
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V5.2c0-.4.3-.7.7-.7h3.6c.4 0 .7.3.7.7V7" />
      <path d="m6.5 7 .8 11.2c.1.7.6 1.3 1.4 1.3h6.6c.8 0 1.3-.6 1.4-1.3L17.5 7M10.2 10.5v5.5M13.8 10.5v5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('size-5 shrink-0', className)}
    >
      {shapes[name]}
    </svg>
  )
}
