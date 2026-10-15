import { describe, expect, it } from '@jest/globals'
import {
  effectiveStatus,
  invitationExpiry,
  isInvitationCode,
  normalizeInvitationCode,
} from './invitations.ts'
import { professionalKinds, requiresRegistration } from './professionals.ts'

describe('professionals', () => {
  it('asks for a council registration from everyone except psychoanalysts', () => {
    expect(professionalKinds.filter(requiresRegistration)).toEqual([
      'psychologist',
      'psychiatrist',
      'physician',
    ])
  })
})

describe('invitations', () => {
  const createdAt = new Date('2026-10-14T12:00:00Z')

  it('lasts 72 hours', () => {
    expect(invitationExpiry(createdAt)).toEqual(new Date('2026-10-17T12:00:00Z'))
  })

  it('is expired once the 72 hours are over while still pending', () => {
    const expiresAt = invitationExpiry(createdAt)

    expect(
      effectiveStatus({ status: 'pending', expiresAt }, new Date('2026-10-17T11:59:59Z')),
    ).toBe('pending')
    expect(effectiveStatus({ status: 'pending', expiresAt }, expiresAt)).toBe('expired')
  })

  it('keeps an answered or canceled invitation as it is after the deadline', () => {
    const later = new Date('2026-11-01T00:00:00Z')
    const expiresAt = invitationExpiry(createdAt)

    expect(effectiveStatus({ status: 'accepted', expiresAt }, later)).toBe('accepted')
    expect(effectiveStatus({ status: 'canceled', expiresAt }, later)).toBe('canceled')
  })

  it('reads codes without ambiguous characters, in any case and with spaces around', () => {
    expect(isInvitationCode(normalizeInvitationCode(' k7m2x9qa '))).toBe(true)
    expect(isInvitationCode('K7M2X9Q')).toBe(false)
    expect(isInvitationCode('K7M2X9Q0')).toBe(false)
    expect(isInvitationCode('K7M2X9QI')).toBe(false)
  })
})
