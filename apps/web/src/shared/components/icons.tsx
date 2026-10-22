interface IconProps {
  className?: string
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function SearchIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <circle cx="9" cy="9" r="5.5" {...stroke} />
      <path d="M13.2 13.2L17 17" {...stroke} />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" {...stroke} />
    </svg>
  )
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M10 3.5v9M6.5 9l3.5 3.5L13.5 9M4 16h12" {...stroke} />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M6.5 4.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M6 4.5h2.6v11H6zM11.4 4.5H14v11h-2.6z" fill="currentColor" />
    </svg>
  )
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M4.5 10a5.5 5.5 0 1 0 1.6-3.9M4.5 3.5v3h3" {...stroke} />
    </svg>
  )
}

export function ForwardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.5 3.5v3h-3" {...stroke} />
    </svg>
  )
}

export function LotusIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" data-icon="lotus" className={className}>
      <path
        d="M10 4c1.9 1.7 2.8 3.7 2.8 5.9S11.9 14 10 15.2C8.1 14 7.2 12.1 7.2 9.9S8.1 5.7 10 4ZM7.3 8.4C5.6 7.8 3.8 7.9 2.5 8.7c.3 3.7 3.3 6.3 7.5 6.5M12.7 8.4c1.7-.6 3.5-.5 4.8.3-.3 3.7-3.3 6.3-7.5 6.5"
        {...stroke}
      />
    </svg>
  )
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M3.5 6h13M6 10h8M8.5 14h3" {...stroke} />
    </svg>
  )
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <rect x="3" y="4.5" width="14" height="11" rx="1.5" {...stroke} />
      <path d="M3.5 5.5l6.5 5 6.5-5" {...stroke} />
    </svg>
  )
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path
        d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1-1"
        {...stroke}
      />
    </svg>
  )
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M10 3v9M6.5 6.5L10 3l3.5 3.5M5 10v5.5h10V10" {...stroke} />
    </svg>
  )
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M10 3.5a6.5 6.5 0 0 0-5.6 9.8L3.5 16.5l3.3-.9A6.5 6.5 0 1 0 10 3.5Z" {...stroke} />
      <path d="M7.6 8.2c.3 1.6 1.6 2.9 3.2 3.4l.9-.8 1.3.6" {...stroke} />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M8 5l5 5-5 5" {...stroke} />
    </svg>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M12.5 4.5l3 3-8.5 8.5H4v-3l8.5-8.5ZM11 6l3 3" {...stroke} />
    </svg>
  )
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M8.5 3.5 9.8 7.2 13.5 8.5 9.8 9.8 8.5 13.5 7.2 9.8 3.5 8.5 7.2 7.2Z" {...stroke} />
      <path
        d="M14.5 12.5 15.1 14.4 17 15 15.1 15.6 14.5 17.5 13.9 15.6 12 15 13.9 14.4Z"
        {...stroke}
      />
      <path d="M15 3v3M13.5 4.5h3" {...stroke} />
    </svg>
  )
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6" {...stroke} />
      <path d="M3.5 3.5v3h3" {...stroke} />
      <path d="M10 6.5V10l2.5 1.5" {...stroke} />
    </svg>
  )
}

export function ComposeIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path
        d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5V11"
        {...stroke}
      />
      <path d="M14.2 3.3a1.5 1.5 0 0 1 2.1 2.1L10 11.7 7.5 12.5l.8-2.5Z" {...stroke} />
    </svg>
  )
}

export function ArrowBackIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M16 10H4.5M9 5.5 4.5 10 9 14.5" {...stroke} />
    </svg>
  )
}

export function MoreIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M5 10h.01M10 10h.01M15 10h.01" {...stroke} strokeWidth={2.4} />
    </svg>
  )
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path
        d="M10 2.75a2.75 2.75 0 0 1 2.75 2.75v4a2.75 2.75 0 0 1-5.5 0v-4A2.75 2.75 0 0 1 10 2.75ZM5 9.25a5 5 0 0 0 10 0M10 14.25v3"
        {...stroke}
      />
    </svg>
  )
}

export function StopIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" fill="currentColor" />
    </svg>
  )
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M10 16V4.5M5 9.25L10 4.25l5 5" {...stroke} strokeWidth={1.9} />
    </svg>
  )
}
