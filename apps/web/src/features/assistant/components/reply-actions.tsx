'use client'

import type { AssistantAction } from '@mycogni/domain'
import { contentLanguageOf, trackText, zenArticles } from '@mycogni/domain'
import type { Route } from 'next'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { BreathingMode } from '@/features/zen/components/breathing-mode'

interface ReplyActionsProps {
  actions: readonly AssistantAction[]
  onLeave: () => void
}

type ActionHref = Route | `/zen/articles/${string}` | `/zen/tracks/${string}`

const actionStyle =
  'inline-flex min-h-10 items-center rounded-[6px] border border-rule px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface motion-reduce:transition-none'

function keyOf(action: AssistantAction): string {
  return 'id' in action ? `${action.type}-${action.id}` : action.type
}

export function ReplyActions({ actions, onLeave }: ReplyActionsProps) {
  const t = useTranslations('assistant.actions')
  const language = contentLanguageOf(useLocale())
  const [breathing, setBreathing] = useState(false)

  function linkOf(action: Exclude<AssistantAction, { type: 'breathe' }>): {
    href: ActionHref
    label: string
  } {
    switch (action.type) {
      case 'article':
        return {
          href: `/zen/articles/${action.id}`,
          label: t('read', { title: zenArticles[action.id].text[language].title }),
        }
      case 'track':
        return {
          href: `/zen/tracks/${action.id}`,
          label: t('track', { title: trackText(language, action.id).title }),
        }
      case 'check_in':
        return { href: '/check-in', label: t('checkIn') }
      case 'mybook':
        return { href: '/mybook', label: t('mybook') }
    }
  }

  return (
    <div role="group" aria-label={t('label')} className="flex flex-wrap gap-2 pt-3">
      {actions.map((action) => {
        if (action.type === 'breathe') {
          return (
            <button
              key={keyOf(action)}
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setBreathing(true)
              }}
              className={actionStyle}
            >
              {t('breathe')}
            </button>
          )
        }
        const { href, label } = linkOf(action)
        return (
          <Link key={keyOf(action)} href={href} onClick={onLeave} className={actionStyle}>
            {label}
          </Link>
        )
      })}
      {breathing && (
        <div
          onKeyDown={(event) => {
            event.stopPropagation()
          }}
        >
          <BreathingMode
            onClose={() => {
              setBreathing(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
