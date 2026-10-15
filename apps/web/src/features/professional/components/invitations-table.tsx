'use client'

import type { CreatedInvitation, SentInvitation } from '@mycogni/contracts'
import type { InvitationStatus } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import { cn } from '@/shared/lib/utils'
import { formatDateTime } from '../dates'
import {
  invitationCounts,
  invitationFilters,
  visibleInvitations,
  type InvitationFilter,
} from '../invitation-table'
import { canResend, isOpen, type CancelInvite, type ResendInvite } from '../invites'
import { paginate } from '../pagination'
import { table, TableScroll } from './data-table'
import { Pager } from './pager'
import { FilterControl, SearchField } from './filter-controls'
import { CancelIcon, ResendIcon } from './icons'
import { CopyLinkButton } from './invitation-link'
import { EmptyState } from './workspace'

const pageSize = 12

const statusDots: Record<InvitationStatus, string> = {
  pending: 'bg-help',
  accepted: 'bg-emphasis',
  declined: 'bg-(--warn)',
  expired: 'bg-muted-foreground/50',
  canceled: 'bg-transparent ring-1 ring-muted-foreground/60 ring-inset',
}

const columns = ['recipient', 'status', 'sent', 'deadline', 'actions'] as const

const iconButton =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-rule px-2.5 text-sm text-foreground transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-50'

interface InvitationsTableProps {
  invitations: readonly SentInvitation[]
  timeZone: string
  resend: ResendInvite
  cancel: CancelInvite
}

function Status({ status }: { status: InvitationStatus }) {
  const t = useTranslations('professional.invites.statuses')
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', statusDots[status])} />
      {t(status)}
    </span>
  )
}

function Deadline({ invitation, timeZone }: { invitation: SentInvitation; timeZone: string }) {
  const t = useTranslations('professional.invites')
  const locale = useLocale()
  const format = (value: string) => formatDateTime(new Date(value), timeZone, locale)
  if (invitation.status === 'pending' || invitation.status === 'expired') {
    return (
      <>
        <span className="mr-1.5 text-muted-foreground">
          {t(invitation.status === 'pending' ? 'expires' : 'expired')}
        </span>
        {format(invitation.expiresAt)}
      </>
    )
  }
  if (invitation.respondedAt !== null && invitation.status !== 'canceled') {
    return (
      <>
        <span className="mr-1.5 text-muted-foreground">{t('responded')}</span>
        {format(invitation.respondedAt)}
      </>
    )
  }
  return <span className="text-muted-foreground">—</span>
}

export function InvitationsTable({ invitations, timeZone, resend, cancel }: InvitationsTableProps) {
  const t = useTranslations('professional')
  const locale = useLocale()
  const [filter, setFilter] = useState<InvitationFilter>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)
  const resending = useSubmit(resend, ({ invitation, emailSent }: CreatedInvitation) => {
    const email = invitation.recipientEmail ?? ''
    setNotice(
      invitation.channel === 'link'
        ? t('invites.sent.renewed')
        : emailSent
          ? t('invites.sent.resent', { email })
          : t('invites.sent.resentNotSent', { email }),
    )
  })
  const canceling = useSubmit(cancel, () => {
    setNotice(t('invites.sent.canceled'))
  })
  const pending = resending.pending || canceling.pending
  const error = resending.error ?? canceling.error
  const rows = visibleInvitations(invitations, { filter, query })
  const current = paginate(rows, page, pageSize)

  if (invitations.length === 0) {
    return <EmptyState>{t('invites.empty')}</EmptyState>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <SearchField
          label={t('invites.search')}
          placeholder={t('invites.searchPlaceholder')}
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
        />
        <FilterControl
          label={t('invites.filter')}
          options={invitationFilters}
          value={filter}
          counts={invitationCounts(invitations)}
          labelOf={(option) => t(`invites.filters.${option}`)}
          onChange={(option) => {
            setFilter(option)
            setPage(1)
          }}
        />
      </div>
      <div className="min-h-5 text-sm">
        {error !== null ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : (
          <p role="status">{notice}</p>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState>{t('invites.noResults')}</EmptyState>
      ) : (
        <>
          <TableScroll label={t('invites.title')}>
            <table className={cn(table.base, 'min-w-[780px]')}>
              <caption className="sr-only">{t('invites.title')}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className={cn(
                        table.head,
                        column === 'recipient' && table.headFirst,
                        column === 'actions' && 'w-px text-right',
                      )}
                    >
                      {column === 'actions' ? (
                        <span className="sr-only">{t('invites.columns.actions')}</span>
                      ) : (
                        t(`invites.columns.${column}`)
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.items.map((invitation) => {
                  const subject =
                    invitation.recipientEmail ?? t('invites.code', { code: invitation.code })
                  return (
                    <tr key={invitation.id} className={table.row}>
                      <td className={cn(table.cell, table.first, 'max-w-44 sm:max-w-72')}>
                        <span className="block truncate font-medium" title={subject}>
                          {invitation.recipientEmail ?? t('invites.sent.byLink')}
                        </span>
                        <span className="block text-[13px] text-muted-foreground">
                          {t('invites.code', { code: invitation.code })}
                        </span>
                      </td>
                      <td className={table.cell}>
                        <Status status={invitation.status} />
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        {formatDateTime(new Date(invitation.createdAt), timeZone, locale)}
                      </td>
                      <td className={cn(table.cell, 'whitespace-nowrap')}>
                        <Deadline invitation={invitation} timeZone={timeZone} />
                      </td>
                      <td className={cn(table.cell, 'py-2.5')}>
                        {canResend(invitation.status) && (
                          <div className="flex items-center justify-end gap-1.5">
                            {isOpen(invitation.status) && (
                              <CopyLinkButton
                                compact
                                link={invitation.link}
                                label={t('invites.actions.copy', { subject })}
                              />
                            )}
                            <button
                              type="button"
                              disabled={pending}
                              aria-label={t(
                                invitation.channel === 'email'
                                  ? 'invites.actions.resend'
                                  : 'invites.actions.renew',
                                { subject },
                              )}
                              title={
                                invitation.channel === 'email'
                                  ? t('invites.sent.resend')
                                  : t('invites.sent.renew')
                              }
                              className={iconButton}
                              onClick={() => {
                                setNotice(null)
                                resending.submit(invitation.id)
                              }}
                            >
                              <ResendIcon className="size-4" />
                            </button>
                            {isOpen(invitation.status) && (
                              <button
                                type="button"
                                disabled={pending}
                                aria-label={t('invites.actions.cancel', { subject })}
                                title={t('invites.sent.cancel')}
                                className={iconButton}
                                onClick={() => {
                                  setNotice(null)
                                  canceling.submit(invitation.id)
                                }}
                              >
                                <CancelIcon className="size-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pager
            label={t('pager.label', { name: t('invites.title') })}
            page={current}
            onPage={setPage}
          />
        </>
      )}
    </div>
  )
}
