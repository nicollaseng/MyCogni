import { topicIds } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

export function TopicTiles() {
  const t = useTranslations('zen.topics')

  return (
    <section aria-labelledby="zen-topics" className="space-y-3">
      <h2 id="zen-topics" className="text-[15px] font-medium">
        {t('title')}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {topicIds.map((id) => (
          <li key={id} className={cn(id === 'help' && 'col-span-2 sm:col-span-1')}>
            <Link
              href={`/zen/topics/${id}`}
              className={cn(
                'flex h-full min-h-16 items-end rounded-lg bg-surface px-4 py-3 text-[15px] leading-snug font-medium text-balance transition-colors duration-150 hover:bg-sage motion-reduce:transition-none',
                id === 'help' && 'text-help',
              )}
            >
              {t(`names.${id}`)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
