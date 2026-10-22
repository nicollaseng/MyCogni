'use client'

import type { ProfessionalReviewDetail } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { Surface } from '@/features/professional/components/workspace'
import {
  canApprove,
  checklistOf,
  councilNames,
  councilSearches,
  type ChecklistItem,
  type Review,
  type ReviewDecision,
} from '../review'
import { RejectForm } from './reject-form'

interface ReviewPanelProps {
  professional: ProfessionalReviewDetail
  review: Review
}

interface Decision {
  status: ReviewDecision
  note?: string
}

const action = 'h-9 px-3.5 text-sm'

function ChecklistLabel({
  item,
  professional,
}: {
  item: ChecklistItem
  professional: ProfessionalReviewDetail
}) {
  const t = useTranslations('admin.professionals.detail.checklist')
  const { council } = professional
  if (item !== 'active' || council === null) {
    return <>{t(item)}</>
  }
  return (
    <>
      {t('active', { council: councilNames[council] })}{' '}
      <a
        href={councilSearches[council]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-1 underline-offset-4"
      >
        {councilSearches[council].replace(/^https:\/\//, '').replace(/\/$/, '')}
      </a>
    </>
  )
}

export function ReviewPanel({ professional, review }: ReviewPanelProps) {
  const t = useTranslations('admin.professionals')
  const items = checklistOf(professional.council)
  const [checked, setChecked] = useState<readonly ChecklistItem[]>([])
  const [rejecting, setRejecting] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [done, setDone] = useState<ReviewDecision | null>(null)
  const { submit, pending, error } = useSubmit(
    async ({ status, note }: Decision): Promise<ActionResult<ReviewDecision>> => {
      const result = await review(
        professional.userId,
        status === 'rejected' ? { status, note: note ?? '' } : { status },
      )
      return result.ok ? { ok: true, value: status } : result
    },
    (status) => {
      setRejecting(false)
      setChecked([])
      setDone(status)
    },
  )
  const verified = professional.status === 'verified'
  const complete = items.every((item) => checked.includes(item))
  const ready = canApprove(professional)

  function toggle(item: ChecklistItem, on: boolean) {
    setChecked((current) =>
      on ? [...current, item] : current.filter((candidate) => candidate !== item),
    )
  }

  function reject(note: string) {
    if (verified) {
      setConfirming(note)
    } else {
      submit({ status: 'rejected', note })
    }
  }

  return (
    <div className="space-y-6">
      <Surface className="space-y-3 p-4 sm:p-5">
        <div className="space-y-0.5">
          <h3 className="font-medium">{t('detail.checklist.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('detail.checklist.description')}</p>
        </div>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item}>
              <label className="flex cursor-pointer gap-3 text-[15px] leading-snug">
                <input
                  type="checkbox"
                  checked={checked.includes(item)}
                  onChange={(event) => {
                    toggle(item, event.currentTarget.checked)
                  }}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
                />
                <span>
                  <ChecklistLabel item={item} professional={professional} />
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Surface>

      <div className="space-y-3">
        <div className="min-h-5 text-sm" aria-live="polite">
          {error !== null ? (
            <p role="alert" className="text-danger">
              {error}
            </p>
          ) : (
            done !== null && (
              <p role="status">
                {t(done === 'verified' ? 'approved' : 'rejected', {
                  name: professional.fullName,
                })}
              </p>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className={action}
            disabled={pending || !ready || !complete}
            onClick={() => {
              setDone(null)
              submit({ status: 'verified' })
            }}
          >
            {t(verified ? 'detail.decision.revalidate' : 'detail.decision.approve')}
          </Button>
          {professional.status !== 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              className={`${action} hover:bg-surface`}
              disabled={pending}
              aria-expanded={rejecting}
              onClick={() => {
                setDone(null)
                setRejecting(true)
              }}
            >
              {t('detail.decision.reject')}
            </Button>
          )}
        </div>
        {(!ready || !complete) && (
          <p className="text-sm text-muted-foreground">
            {t(ready ? 'detail.decision.checklistPending' : 'detail.decision.missing')}
          </p>
        )}
        {rejecting && (
          <RejectForm
            name={professional.fullName}
            pending={pending}
            onReject={reject}
            onCancel={() => {
              setRejecting(false)
            }}
          />
        )}
      </div>

      {confirming !== null && (
        <ConfirmDialog
          title={t('detail.confirm.title', { name: professional.fullName })}
          body={t('detail.confirm.body', {
            name: professional.fullName,
            links: professional.activeLinks,
            invitations: professional.pendingInvitations,
          })}
          confirmLabel={t('detail.confirm.confirm')}
          cancelLabel={t('detail.confirm.cancel')}
          onCancel={() => {
            setConfirming(null)
          }}
          onConfirm={() => {
            submit({ status: 'rejected', note: confirming })
          }}
        />
      )}
    </div>
  )
}
