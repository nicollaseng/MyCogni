import { describe, expect, it } from '@jest/globals'
import {
  canMoveSupportTicket,
  needsCustomSubject,
  nextSupportStatuses,
  supportSubjects,
  supportTicketLabel,
  supportTicketStatuses,
} from './tickets.ts'

describe('support tickets', () => {
  it('lets the team take a pending ticket or close it, and keeps a closed ticket closed', () => {
    expect(nextSupportStatuses('pending')).toEqual(['in_progress', 'closed'])
    expect(nextSupportStatuses('in_progress')).toEqual(['closed'])
    expect(nextSupportStatuses('closed')).toEqual([])
    expect(canMoveSupportTicket('pending', 'in_progress')).toBe(true)
    expect(canMoveSupportTicket('in_progress', 'closed')).toBe(true)
    expect(canMoveSupportTicket('in_progress', 'pending')).toBe(false)
    expect(canMoveSupportTicket('pending', 'pending')).toBe(false)
    for (const status of supportTicketStatuses) {
      expect(canMoveSupportTicket('closed', status)).toBe(false)
    }
  })

  it('asks for a written subject only when none of the listed ones fits', () => {
    expect(supportSubjects.filter(needsCustomSubject)).toEqual(['other'])
  })

  it('shows the ticket number the way people read it out to the team', () => {
    expect(supportTicketLabel(1042)).toBe('#1042')
  })
})
