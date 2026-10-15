import { maxScoreOf, type Instrument } from '@mycogni/domain'
import { cn } from '@/shared/lib/utils'

interface ScoreScaleProps {
  instrument: Instrument
  score: number
}

export function ScoreScale({ instrument, score }: ScoreScaleProps) {
  const slots = maxScoreOf(instrument) + 1
  const bands = instrument.bands.map((band, index) => ({
    ...band,
    end: instrument.bands[index + 1]?.min ?? slots,
  }))

  return (
    <div aria-hidden className="relative mt-3 h-4">
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 gap-[3px]">
        {bands.map((band) => (
          <span
            key={band.severity}
            style={{ flexGrow: band.end - band.min }}
            className={cn(
              'h-[3px] basis-0 rounded-full',
              score >= band.min && score < band.end ? 'bg-foreground' : 'bg-rule',
            )}
          />
        ))}
      </div>
      <span
        className="absolute top-1/2 size-3.5 -translate-1/2 animate-marker rounded-full border-2 border-background bg-foreground motion-reduce:animate-none"
        style={{ left: `${String(((score + 0.5) / slots) * 100)}%` }}
      />
    </div>
  )
}
