import { instrumentText } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

const chosen = 1

export function QuestionnairePreview() {
  const t = useTranslations('landing.howItWorks.questionnaire')
  const { options } = instrumentText(useLocale(), 'phq9')

  return (
    <figure className="w-full border-l-2 border-rule pl-5">
      <figcaption className="text-xs text-muted-foreground">{t('caption')}</figcaption>
      <p className="mt-2 font-serif text-[17px] leading-snug">{t('question')}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {options.map((option, index) => (
          <li key={option} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn(
                'size-3 rounded-full border',
                index === chosen ? 'border-foreground bg-foreground' : 'border-foreground/35',
              )}
            />
            <span className={cn(index === chosen && 'text-foreground')}>{option}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
