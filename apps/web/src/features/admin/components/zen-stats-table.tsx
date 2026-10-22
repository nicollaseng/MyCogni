import type { ZenContentStats } from '@mycogni/contracts'
import { useFormatter, useTranslations } from 'next-intl'

export interface ZenStatsRow {
  key: string
  kindLabel: string
  title: string
  stats: ZenContentStats | null
}

function share(part: number | null | undefined, whole: number): number | null {
  return part === null || part === undefined || whole === 0 ? null : part / whole
}

export function ZenStatsTable({ rows }: { rows: readonly ZenStatsRow[] }) {
  const t = useTranslations('admin.zen')
  const format = useFormatter()
  const missing = '—'
  const count = (value: number | null | undefined) =>
    value === null || value === undefined ? missing : format.number(value)
  const percent = (value: number | null) =>
    value === null ? missing : format.number(value, { style: 'percent', maximumFractionDigits: 0 })

  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <thead className="bg-surface text-left text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              {t('columns.content')}
            </th>
            {(
              [
                'people',
                'starts',
                'completions',
                'rate',
                'median',
                'better',
                'same',
                'worse',
              ] as const
            ).map((column) => (
              <th key={column} scope="col" className="px-3 py-3 text-right font-medium">
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, kindLabel, title, stats }) => {
            const compared = (stats?.better ?? 0) + (stats?.same ?? 0) + (stats?.worse ?? 0)
            return (
              <tr key={key} className="border-t border-rule">
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  <span className="block text-xs text-muted-foreground">{kindLabel}</span>
                  {title}
                </th>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(stats?.people)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(stats?.starts)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{count(stats?.completions)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {percent(share(stats?.completions, stats?.starts ?? 0))}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {stats?.medianSeconds === null || stats?.medianSeconds === undefined
                    ? missing
                    : format.number(stats.medianSeconds / 60, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {percent(share(stats?.better, compared))}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {percent(share(stats?.same, compared))}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {percent(share(stats?.worse, compared))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
