import { maxMoodLevel } from '@mycogni/domain'
import type { ReactNode } from 'react'
import { moodColor } from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'
import { bandCenter, percentOf, segmentsOf } from '../chart-scale'

function position(index: number, count: number): string {
  return `${String(bandCenter(index, count))}%`
}

export function Columns({
  values,
  max,
  active,
}: {
  values: readonly number[]
  max: number
  active: number | null
}) {
  return (
    <div className="absolute inset-0 flex">
      {values.map((value, index) => (
        <div key={index} className="flex h-full flex-1 items-end justify-center">
          {value > 0 && (
            <span
              className={cn(
                'block w-[64%] max-w-6 rounded-t-[4px] bg-emphasis transition-opacity duration-150 motion-reduce:transition-none',
                active !== null && active !== index && 'opacity-40',
              )}
              style={{ height: `${String(percentOf(value, 0, max))}%` }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function MoodLine({
  values,
  active,
}: {
  values: readonly (number | null)[]
  active: number | null
}) {
  const count = values.length
  const y = (value: number) => 100 - percentOf(value, 0, maxMoodLevel)
  const lines = segmentsOf(values).filter((segment) => segment.length > 1)

  return (
    <>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible text-muted-foreground"
      >
        {lines.map((segment) => (
          <polyline
            key={segment.map((point) => point.index).join('-')}
            points={segment
              .map((point) => `${String(bandCenter(point.index, count))},${String(y(point.value))}`)
              .join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {values.map((value, index) =>
        value === null ? null : (
          <span
            key={index}
            className={cn(
              'absolute size-[9px] -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-surface transition-[width,height] duration-150 motion-reduce:transition-none',
              active === index && 'size-[13px]',
            )}
            style={{
              left: position(index, count),
              bottom: `${String(percentOf(value, 0, maxMoodLevel))}%`,
              backgroundColor: moodColor(value / maxMoodLevel),
            }}
          />
        ),
      )}
    </>
  )
}

export function ChartTable({
  summary,
  headers,
  rows,
}: {
  summary: string
  headers: readonly string[]
  rows: readonly { key: string; cells: readonly ReactNode[] }[]
}) {
  return (
    <details className="group mt-2">
      <summary className="w-fit cursor-pointer rounded-[4px] text-sm text-muted-foreground transition-colors hover:text-foreground">
        {summary}
      </summary>
      <div className="mt-3 max-h-72 overflow-y-auto rounded-[6px] bg-background/60 px-2 [scrollbar-width:thin]">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={cn(
                    'sticky top-0 bg-background px-2 py-2 text-left font-normal text-muted-foreground',
                    index > 0 && 'text-right',
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                {row.cells.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row" className="px-2 py-1.5 text-left font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={index} className="px-2 py-1.5 text-right">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
