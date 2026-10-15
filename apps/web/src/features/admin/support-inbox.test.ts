import { describe, expect, it } from '@jest/globals'
import { adminTicket, closedTicket, pendingTicket } from '@/features/support/test-data'
import { defaultInboxSort, inboxStatusOf, nextInboxSort, visibleTickets } from './support-inbox'

const ana = adminTicket(pendingTicket, { name: 'Ana Souza', email: 'ana@exemplo.com' })
const bruno = adminTicket(closedTicket, { name: 'Bruno Lima', email: 'bruno@exemplo.com' })
const subjectOf = (ticket: { customSubject: string | null }) => ticket.customSubject ?? 'Técnico'

describe('support inbox', () => {
  it('reads the status tab from the address', () => {
    expect(inboxStatusOf('in_progress')).toBe('in_progress')
    expect(inboxStatusOf(['closed'])).toBe('pending')
    expect(inboxStatusOf(undefined)).toBe('pending')
  })

  it('shows the oldest waiting tickets first and the latest closed ones first', () => {
    expect(defaultInboxSort('pending')).toEqual({ key: 'createdAt', direction: 'asc' })
    expect(defaultInboxSort('closed')).toEqual({ key: 'createdAt', direction: 'desc' })
    expect(
      visibleTickets([ana, bruno], { query: '', sort: defaultInboxSort('pending') }, subjectOf).map(
        (ticket) => ticket.number,
      ),
    ).toEqual([1043, 1042])
  })

  it('sorts by number and flips the direction on the same column', () => {
    const byNumber = nextInboxSort(defaultInboxSort('pending'), 'number')
    expect(byNumber).toEqual({ key: 'number', direction: 'asc' })
    expect(nextInboxSort(byNumber, 'number')).toEqual({ key: 'number', direction: 'desc' })
    expect(
      visibleTickets([bruno, ana], { query: '', sort: byNumber }, subjectOf).map(
        (ticket) => ticket.number,
      ),
    ).toEqual([1042, 1043])
  })

  it('finds tickets by number, person, email or subject without accents', () => {
    const sort = defaultInboxSort('pending')
    const find = (query: string) =>
      visibleTickets([ana, bruno], { query, sort }, subjectOf).map((ticket) => ticket.number)

    expect(find('#1042')).toEqual([1042])
    expect(find('bruno@')).toEqual([1043])
    expect(find('ANA SOUZA')).toEqual([1042])
    expect(find('exportar')).toEqual([1043])
    expect(find('tecnico')).toEqual([1042])
  })
})
