import type { CheckIn } from '@mycogni/contracts'
import { isMoodLevel, labelOf, moodColor, valenceOf } from '@/features/mood/mood-levels'
import { formatTime } from '@/shared/lib/time'
import type { DayGroup } from '../group-by-day'

function Entry({ checkIn, timeZone }: { checkIn: CheckIn; timeZone: string }) {
  if (!isMoodLevel(checkIn.moodLevel)) {
    return null
  }
  const tags = [...checkIn.emotions, ...checkIn.contexts]
  return (
    <li className="flex gap-5 border-b border-rule py-4">
      <time
        dateTime={checkIn.recordedAt}
        className="w-11 shrink-0 pt-px text-sm text-muted-foreground"
      >
        {formatTime(new Date(checkIn.recordedAt), timeZone)}
      </time>
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: moodColor(valenceOf(checkIn.moodLevel)) }}
          />
          {labelOf(checkIn.moodLevel)}
        </p>
        {tags.length > 0 && <p className="text-sm text-muted-foreground">{tags.join(' · ')}</p>}
        {checkIn.note !== null && (
          <p className="pt-1 font-serif text-[17px] leading-relaxed text-pretty">{checkIn.note}</p>
        )}
      </div>
    </li>
  )
}

export function EntryList({ groups, timeZone }: { groups: readonly DayGroup[]; timeZone: string }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h2 className="pb-3 text-xs tracking-[0.04em] text-muted-foreground">{group.label}</h2>
          <ol className="border-t border-rule">
            {group.checkIns.map((checkIn) => (
              <Entry key={checkIn.id} checkIn={checkIn} timeZone={timeZone} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
