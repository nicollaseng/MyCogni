import type { AssistantMode } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { SafetyPanel } from '@/features/safety/components/safety-panel'
import type { LinkedProfessional } from '@/shared/lib/emergency-contacts'

interface SupportCardProps {
  mode: AssistantMode
  contacts: readonly LinkedProfessional[]
}

export function SupportCard({ mode, contacts }: SupportCardProps) {
  const t = useTranslations('assistant')

  if (mode === 'professional') {
    return (
      <div
        role="note"
        aria-label={t('professionalSupport.title')}
        className="space-y-1 rounded-[8px] bg-mist px-4 py-3.5 text-sm leading-relaxed"
      >
        <p className="font-medium">{t('professionalSupport.title')}</p>
        <p className="text-muted-foreground">{t('professionalSupport.body')}</p>
      </div>
    )
  }

  return <SafetyPanel level="urgent" intro={false} professionals={contacts} />
}
