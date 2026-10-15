import { crisisLinesFor } from '@mycogni/domain'
import { useLocale } from 'next-intl'

export function CrisisNumbers() {
  const lines = crisisLinesFor(useLocale())

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1">
      {lines.map((line) => (
        <li key={line.phone}>
          <a
            href={`tel:${line.phone}`}
            className="inline-flex min-h-11 items-center gap-1.5 font-medium text-foreground underline decoration-1 underline-offset-4"
          >
            <span className="tabular-nums">{line.display}</span>
            <span className="font-normal text-muted-foreground">{line.name}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
