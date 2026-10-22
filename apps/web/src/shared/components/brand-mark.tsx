import { cn } from '@/shared/lib/utils'

const centre =
  'M12 8.51C12.71 8.55 13.48 9.08 14.04 9.57C14.6 10.05 15.17 10.7 15.35 11.41C15.54 12.11 15.5 13.19 15.13 13.81C14.76 14.42 13.84 14.89 13.13 15.11C12.42 15.33 11.55 15.36 10.86 15.13C10.17 14.9 9.37 14.34 9.01 13.73C8.65 13.11 8.6 12.16 8.72 11.42C8.85 10.69 9.21 9.81 9.75 9.32C10.3 8.84 11.29 8.47 12 8.51Z'

const contours = [
  'M12 5.21C13.39 5.34 14.77 6.48 15.84 7.42C16.91 8.36 18.11 9.55 18.44 10.87C18.76 12.18 18.48 14.15 17.77 15.33C17.07 16.52 15.53 17.49 14.18 18C12.83 18.51 10.96 18.86 9.67 18.39C8.39 17.92 7.1 16.42 6.5 15.18C5.9 13.94 5.91 12.38 6.08 10.96C6.25 9.54 6.52 7.61 7.51 6.65C8.5 5.69 10.61 5.08 12 5.21Z',
  'M12 2.14C14.13 2.25 16.46 3.37 18.11 4.72C19.76 6.07 21.63 8.29 21.91 10.25C22.19 12.22 20.91 14.72 19.8 16.5C18.69 18.29 17.18 19.99 15.26 20.95C13.33 21.91 10.15 22.98 8.26 22.26C6.38 21.55 4.77 18.61 3.96 16.64C3.14 14.68 3.15 12.58 3.38 10.48C3.6 8.38 3.89 5.44 5.33 4.05C6.77 2.66 9.87 2.03 12 2.14Z',
]

const contourOpacity = [0.78, 0.48]

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      data-testid="brand-mark"
      className={cn('size-6 shrink-0 text-emphasis', className)}
    >
      <path d={centre} fill="currentColor" />
      {contours.map((d, index) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeOpacity={contourOpacity[index]}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
