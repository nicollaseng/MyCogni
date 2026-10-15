import { useFormatter, type DateTimeFormatOptions } from 'next-intl'

interface Period {
  periodStart: string
  periodEnd: string
}

type PeriodStyle = 'patient' | 'professional'

const styles: Record<PeriodStyle, DateTimeFormatOptions> = {
  patient: { day: 'numeric', month: 'long' },
  professional: { day: 'numeric', month: 'short', year: 'numeric' },
}

export function useReadingPeriod(timeZone: string, style: PeriodStyle): (period: Period) => string {
  const format = useFormatter()
  return ({ periodStart, periodEnd }) =>
    format.dateTimeRange(new Date(periodStart), new Date(periodEnd), {
      ...styles[style],
      timeZone,
    })
}
