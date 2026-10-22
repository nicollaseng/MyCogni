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

export function WaveIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M2.5 11c2.5-3 5-3 7.5 0s5 3 7.5 0M2.5 7c2.5-3 5-3 7.5 0s5 3 7.5 0" {...stroke} />
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
