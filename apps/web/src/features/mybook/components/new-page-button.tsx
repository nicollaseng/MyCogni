'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import { reportOutdatedApp } from '@/shared/lib/actions/outdated'
import { failure, type ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { browserPageClient, type PageClient } from '../page-client'
import { Icon } from './icon'

interface NewPageButtonProps {
  label: string
  size?: 'sm' | 'default'
  client?: Pick<PageClient, 'create'>
}

export function NewPageButton({
  label,
  size = 'sm',
  client = browserPageClient,
}: NewPageButtonProps) {
  const t = useTranslations('mybook.list')
  const router = useRouter()
  const { submit, pending, error } = useSubmit(
    async (): Promise<ActionResult<string> | null> => {
      const outcome = await client.create()
      if (outcome.kind === 'outdated') {
        reportOutdatedApp()
        return null
      }
      return outcome.kind === 'created'
        ? { ok: true, value: outcome.id }
        : failure(t('createError'))
    },
    (id) => {
      router.push(`/mybook/${id}`)
    },
  )

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
