import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Button } from '@/shared/ui/button'

interface ConsentPromptProps {
  onAllow: (journal: boolean) => Promise<boolean>
  onDismiss: () => void
}

export function ConsentPrompt({ onAllow, onDismiss }: ConsentPromptProps) {
  const t = useTranslations('assistant.consent')
  const titleId = useId()
  const [journal, setJournal] = useState(false)
  const [saving, setSaving] = useState(false)

  async function allow() {
    setSaving(true)
    await onAllow(journal)
    setSaving(false)
  }

  return (
    <section aria-labelledby={titleId} className="space-y-3 rounded-[8px] bg-surface px-4 py-4">
      <h3 id={titleId} className="text-[15px] font-medium">
        {t('title')}
      </h3>
      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('body')}</p>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={journal}
          disabled={saving}
          onChange={(event) => {
            setJournal(event.target.checked)
          }}
          className="size-4 accent-(--primary)"
        />
        {t('journal')}
      </label>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" disabled={saving} onClick={() => void allow()}>
          {saving ? t('saving') : t('allow')}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={onDismiss}>
          {t('later')}
        </Button>
      </div>
    </section>
  )
}
