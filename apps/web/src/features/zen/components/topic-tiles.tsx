import { topicIds, type TopicId } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { TopicIcon } from './topic-icon'

const tints: Readonly<Record<TopicId, string>> = {
  anxiety: 'bg-tint-calm',
  mood: 'bg-tint-bright',
  sleep: 'bg-tint-night',
  performance: 'bg-tint-earth',
  help: 'bg-mist text-help',
}

export function TopicTiles() {
  const t = useTranslations('zen.topics')

  return (
    <section aria-labelledby="zen-topics" className="space-y-4">
      <h2 id="zen-topics" className="font-serif text-[26px] leading-tight tracking-[-0.01em]">
        {t('title')}
      </h2>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {topicIds.map((id) => (
          <li key={id} className={cn(id === 'help' && 'col-span-2 sm:col-span-1')}>
            <Link
              href={`/zen/topics/${id}`}
              className={cn(
                'flex h-full min-h-28 flex-col justify-between gap-4 rounded-lg px-4 pt-4 pb-3.5 transition-[filter] duration-150 hover:brightness-[0.97] motion-reduce:transition-none dark:hover:brightness-110',
                tints[id],
              )}
            >
              <TopicIcon id={id} className={id === 'help' ? 'text-help' : 'text-emphasis'} />
              <span className="text-[15px] leading-snug font-medium text-balance">
                {t(`names.${id}`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
