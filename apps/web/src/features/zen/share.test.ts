import { describe, expect, it } from '@jest/globals'
import { articlePath, mailtoHref, whatsappHref } from './share'

describe('share links', () => {
  it('puts the whole message, encoded, in a plain wa.me link', () => {
    const href = whatsappHref(
      'A hora — Uma técnica & mais?\nhttps://mycogni.app/articles/worry-time',
    )
    const url = new URL(href)

    expect(url.origin).toBe('https://wa.me')
    expect([...url.searchParams.keys()]).toEqual(['text'])
    expect(url.searchParams.get('text')).toBe(
      'A hora — Uma técnica & mais?\nhttps://mycogni.app/articles/worry-time',
    )
    expect(href).toContain('%26')
    expect(href).toContain('%0A')
  })

  it('writes the subject and the body of an email', () => {
    const href = mailtoHref('Título & mais', 'Resumo.\n\nhttps://mycogni.app/articles/worry-time')

    expect(href).toBe(
      'mailto:?subject=T%C3%ADtulo%20%26%20mais&body=Resumo.%0A%0Ahttps%3A%2F%2Fmycogni.app%2Farticles%2Fworry-time',
    )
  })

  it('points to the public article', () => {
    expect(articlePath('worry-time')).toBe('/articles/worry-time')
  })
})
