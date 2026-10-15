import { describe, expect, it } from '@jest/globals'
import { invitationCounts, visibleInvitations } from './invitation-table'
import { invitation } from './test-data'

const marina = invitation({ recipientEmail: 'marina@exemplo.com', code: 'K7M2X9QA' })
const byLink = invitation({ channel: 'link', recipientEmail: null, code: 'ZX4R8T2B' })
const accepted = invitation({ recipientEmail: 'joao@exemplo.com', status: 'accepted' })
const expired = invitation({ recipientEmail: 'ana@exemplo.com', status: 'expired' })

const all = [marina, byLink, accepted, expired]

describe('visibleInvitations', () => {
  it('keeps only the chosen status', () => {
    expect(visibleInvitations(all, { filter: 'pending', query: '' })).toEqual([marina, byLink])
    expect(visibleInvitations(all, { filter: 'expired', query: '' })).toEqual([expired])
    expect(visibleInvitations(all, { filter: 'all', query: '' })).toEqual(all)
  })

  it('searches by email or by code, ignoring case', () => {
    expect(visibleInvitations(all, { filter: 'all', query: 'MARINA' })).toEqual([marina])
    expect(visibleInvitations(all, { filter: 'all', query: 'zx4r' })).toEqual([byLink])
    expect(visibleInvitations(all, { filter: 'accepted', query: 'marina' })).toEqual([])
  })
})

describe('invitationCounts', () => {
  it('counts every status for the filter chips', () => {
    expect(invitationCounts(all)).toEqual({
      all: 4,
      pending: 2,
      accepted: 1,
      declined: 0,
      expired: 1,
      canceled: 0,
    })
  })
})
