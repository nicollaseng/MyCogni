import { useTranslations } from 'next-intl'

export function TeamNote({ note }: { note: string | null }) {
  const t = useTranslations('professional.status.rejected')
  if (note === null) {
    return null
  }
  return (
    <figure className="max-w-2xl space-y-1.5">
      <figcaption className="text-sm text-muted-foreground">{t('note')}</figcaption>
      <blockquote className="border-l-2 border-danger/60 pl-4 leading-relaxed whitespace-pre-line">
        {note}
      </blockquote>
    </figure>
  )
}
