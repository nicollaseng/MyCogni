import { describe, expect, it } from '@jest/globals'
import { emailLinkCallback, emailLinkFailedPath, emailLinkTypeOf } from './email-link'

describe('emailLinkTypeOf', () => {
  it('accepts the email confirmation and the password recovery', () => {
    expect(emailLinkTypeOf('email')).toBe('email')
    expect(emailLinkTypeOf('recovery')).toBe('recovery')
  })

  it('refuses anything else, so a link cannot pick another flow', () => {
    expect(emailLinkTypeOf(null)).toBeNull()
    expect(emailLinkTypeOf('')).toBeNull()
    expect(emailLinkTypeOf('signup')).toBeNull()
    expect(emailLinkTypeOf('magiclink')).toBeNull()
    expect(emailLinkTypeOf('Recovery')).toBeNull()
    expect(emailLinkTypeOf('https://evil.example')).toBeNull()
  })
})

describe('emailLinkCallback', () => {
  it('sends the email link back to the callback of this site with the flow', () => {
    expect(emailLinkCallback('https://mycogniapp.com', 'email')).toBe(
      'https://mycogniapp.com/auth/callback?flow=email',
    )
    expect(emailLinkCallback('http://localhost:3000', 'recovery')).toBe(
      'http://localhost:3000/auth/callback?flow=recovery',
    )
  })

  it('reports a failed link on the sign in page of this site', () => {
    expect(emailLinkFailedPath).toBe('/sign-in?error=link')
  })
})
