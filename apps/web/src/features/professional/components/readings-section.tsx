import type { ProfessionalInsight } from '@mycogni/contracts'
import { insightCheckInThreshold } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useReadingPeriod } from '@/features/insights/use-reading-period'
import { ReadingDetail } from './reading-detail'
import { ReadingsTable } from './readings-table'
import { Quiet, Surface, WorkspaceSection } from './workspace'

interface ReadingsSectionProps {
  readings: readonly ProfessionalInsight[]
  timeZone: string
}

export function ReadingsSection({ readings, timeZone }: ReadingsSectionProps) {
  const t = useTranslations('insights.professional')
  const periodOf = useReadingPeriod(timeZone, 'professional')
  const [latest, ...earlier] = readings

  return (
    <WorkspaceSection title={t('title')} description={t('note')}>
      {latest === undefined ? (
        <Quiet>{t('empty', { threshold: insightCheckInThreshold })}</Quiet>
      ) : (
        <>
          <Surface className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
            <p className="text-sm text-muted-foreground">
              {t('period', { period: periodOf(latest), count: latest.checkInCount })}
            </p>
            <ReadingDetail content={latest.content} withLevel heading="h3" />
          </Surface>
          {earlier.length > 0 && (
            <div className="space-y-2 pt-3">
              <h3 className="text-sm text-muted-foreground">{t('earlier')}</h3>
              <ReadingsTable
                readings={earlier.map((reading) => ({ reading, period: periodOf(reading) }))}
              />
            </div>
          )}
        </>
      )}
    </WorkspaceSection>
  )
}
