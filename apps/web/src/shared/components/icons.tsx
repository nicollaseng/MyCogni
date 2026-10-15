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

export function FilterIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M3.5 6h13M6 10h8M8.5 14h3" {...stroke} />
    </svg>
  )
}
