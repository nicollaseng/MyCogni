import { assistantLimits } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useRef, useState, type KeyboardEvent, type SubmitEvent } from 'react'
import { Button } from '@/shared/ui/button'

interface ChatComposerProps {
  pending: boolean
  onSend: (text: string) => Promise<boolean>
}

export function ChatComposer({ pending, onSend }: ChatComposerProps) {
  const t = useTranslations('assistant.composer')
  const id = useId()
  const form = useRef<HTMLFormElement>(null)
  const [text, setText] = useState('')
  const max = assistantLimits.messageLength

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text
    if (value.trim() === '' || pending) {
      return
    }
    setText('')
    if (!(await onSend(value))) {
      setText(value)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      form.current?.requestSubmit()
    }
  }

  return (
    <form ref={form} onSubmit={(event) => void submit(event)} className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {t('label')}
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id={id}
          rows={1}
          value={text}
          maxLength={max}
          placeholder={t('placeholder')}
          aria-describedby={`${id}-count`}
          onChange={(event) => {
            setText(event.target.value)
          }}
          onKeyDown={onKeyDown}
          className="max-h-36 min-h-12 flex-1 resize-none rounded-[6px] border border-rule bg-background px-3.5 py-3 text-base leading-snug outline-none field-sizing-content placeholder:text-muted-foreground focus:border-foreground"
        />
        <Button type="submit" size="sm" className="h-12" disabled={pending || text.trim() === ''}>
          {t('send')}
        </Button>
      </div>
      <p id={`${id}-count`} className="text-right text-xs text-muted-foreground tabular-nums">
        {t('count', { count: text.length, max })}
      </p>
    </form>
  )
}
