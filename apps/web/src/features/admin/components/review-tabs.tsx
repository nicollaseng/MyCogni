import { useTranslations } from 'next-intl'
import { reviewViews, type ReviewView } from '../review'
import { AdminTabs } from './admin-tabs'

export function ReviewTabs({ current }: { current: ReviewView }) {
  const t = useTranslations('admin.professionals.tabs')

  return (
    <AdminTabs
      label={t('label')}
      options={reviewViews}
      current={current}
      labelOf={(view) => t(view)}
      hrefOf={(view) => ({ pathname: '/admin/professionals', query: { status: view } })}
    />
  )
}
