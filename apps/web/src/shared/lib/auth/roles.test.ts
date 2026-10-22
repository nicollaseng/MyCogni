import { describe, expect, it } from '@jest/globals'
import { isAdminRole } from './roles'

describe('isAdminRole', () => {
  it('accepts only the admin role set by the server in the app metadata', () => {
    expect(isAdminRole({ role: 'admin' })).toBe(true)
    expect(isAdminRole({ role: 'professional' })).toBe(false)
    expect(isAdminRole({})).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
  })
})
