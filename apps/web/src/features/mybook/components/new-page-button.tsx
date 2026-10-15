'use client'

import { useTranslations } from 'next-intl'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { Icon } from './icon'

interface NewPageButtonProps {
  create: () => Promise<ActionResult<null>>
  label: string
  size?: 'sm' | 'default'
}

export function NewPageButton({ create, label, size = 'sm' }: NewPageButtonProps) {
  const t = useTranslations('mybook.list')
  const { submit, pending, error } = useSubmit(create, () => undefined)

  return (
    <div className="space-y-2">
      <Button
        size={size}
        disabled={pending}
        className="gap-1.5 pl-3.5"
        onClick={() => {
          submit()
        }}
      >
        <Icon name="plus" className="size-[18px]" />
        {pending ? t('creating') : label}
      </Button>
      <ActionError error={error} />
    </div>
  )
}
