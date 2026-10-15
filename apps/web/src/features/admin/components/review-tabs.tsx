import { professionalStatuses, type ProfessionalStatus } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { AdminTabs } from './admin-tabs'

export function ReviewTabs({ current }: { current: ProfessionalStatus }) {
  const t = useTranslations('admin.professionals.tabs')

  return (
    <AdminTabs
      label={t('label')}
      options={professionalStatuses}
      current={current}
      labelOf={(status) => t(status)}
      hrefOf={(status) => ({ pathname: '/admin/professionals', query: { status } })}
    />
  )
}
