import { crisisLinesFor } from '@mycogni/domain'
import { useLocale } from 'next-intl'

export function HelpLines() {
  const lines = crisisLinesFor(useLocale())

  return (
    <dl className="space-y-3 text-[15px] leading-relaxed">
      {lines.map((line) => (
        <div key={line.phone}>
          <dt className="font-medium">
            <a href={`tel:${line.phone}`} className="underline decoration-1 underline-offset-4">
              {line.display}
            </a>
          </dt>
          <dd className="text-muted-foreground">{line.description}</dd>
        </div>
      ))}
    </dl>
  )
}
