import { articleIds } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { articles } from '../content/articles'
import { contentLanguageOf } from '../content/language'
import { readingMinutes } from '../reading'

const rowStyles =
  'block rounded-lg px-5 py-4 transition-colors duration-150 hover:bg-surface motion-reduce:transition-none'

export function ArticleList() {
  const t = useTranslations('zen.readings')
  const language = contentLanguageOf(useLocale())

  return (
    <section aria-labelledby="zen-readings" className="space-y-2">
      <h2 id="zen-readings" className="text-[15px] font-medium">
        {t('title')}
      </h2>
      <ul className="-mx-5">
        {articleIds.map((id) => {
          const text = articles[id].text[language]
          return (
            <li key={id}>
              <Link href={`/zen/articles/${id}`} className={rowStyles}>
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-serif text-[19px] leading-snug">{text.title}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {t('minutes', { minutes: readingMinutes(text) })}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-pretty text-muted-foreground">
                  {text.summary}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
