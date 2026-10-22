import { useTranslations } from 'next-intl'
import type { Ref } from 'react'
import { CloseIcon, ComposeIcon, HistoryIcon } from '@/shared/components/icons'
import { HeaderButton } from './header-button'

interface ChatHeaderProps {
  titleId: string | undefined
  title: string
  empty: boolean
  historyButton: Ref<HTMLButtonElement>
  onHistory: () => void
  onNew: () => void
  onClose: () => void
}

export function ChatHeader({
  titleId,
  title,
  empty,
  historyButton,
  onHistory,
  onNew,
  onClose,
}: ChatHeaderProps) {
  const t = useTranslations('assistant')

  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 sm:px-4 sm:pt-5">
      <HeaderButton ref={historyButton} label={t('header.history')} onClick={onHistory} outlined>
        <HistoryIcon className="size-5" />
      </HeaderButton>
      <h2
        id={titleId}
        className="min-w-0 flex-1 truncate px-1.5 font-serif text-[20px] leading-tight tracking-[-0.01em]"
      >
        {title}
      </h2>
      <HeaderButton label={t('header.new')} onClick={onNew} disabled={empty}>
        <ComposeIcon className="size-5" />
      </HeaderButton>
      <HeaderButton label={t('close')} onClick={onClose}>
        <CloseIcon className="size-5" />
      </HeaderButton>
    </div>
  )
}
