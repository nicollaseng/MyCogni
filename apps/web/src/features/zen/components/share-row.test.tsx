import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '@/test/render'
import { ShareRow } from './share-row'

const article = {
  title: 'A hora da preocupação',
  lead: 'Uma técnica simples. Dar um horário à preocupação.',
  teaser: 'Uma técnica simples.',
  url: 'http://localhost:3400/articles/worry-time',
}

function renderRow(locale: 'pt-BR' | 'pt-PT' | 'en-US' = 'pt-BR') {
  return renderWithIntl(<ShareRow {...article} />, { locale })
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  Reflect.deleteProperty(navigator, 'share')
})

describe('ShareRow', () => {
  it('shares on WhatsApp with the title, the first sentence and the public link only', () => {
    renderRow()

    const link = screen.getByRole('link', { name: 'Compartilhar no WhatsApp' })
    const url = new URL(link.getAttribute('href') ?? '')
    expect(url.origin).toBe('https://wa.me')
    expect([...url.searchParams.keys()]).toEqual(['text'])
    expect(url.searchParams.get('text')).toBe(
      'A hora da preocupação — Uma técnica simples.\nhttp://localhost:3400/articles/worry-time',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('writes an email with the title as subject and the lead with the link as body', () => {
    renderRow()

    const href = screen.getByRole('link', { name: 'Compartilhar por e-mail' }).getAttribute('href')
    const [, query] = (href ?? '').split('?')
    const params = new URLSearchParams(query)
    expect(href).toMatch(/^mailto:\?/)
    expect(params.get('subject')).toBe(article.title)
    expect(params.get('body')).toBe(`${article.lead}\n\n${article.url}`)
    expect(href).not.toMatch(/utm_|ref=/)
  })

  it('copies the link and says so for two seconds', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) })
    renderRow()

    await user.click(screen.getByRole('button', { name: 'Copiar link' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Link copiado')
    })
    expect(await navigator.clipboard.readText()).toBe(article.url)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000)
    })
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('offers more apps only where the device can share natively', async () => {
    const { unmount } = renderRow()
    expect(screen.queryByRole('button', { name: 'Mais opções para compartilhar' })).toBeNull()
    unmount()

    const share = jest.fn<(data: ShareData) => Promise<void>>(() => Promise.resolve())
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) })
    renderRow()

    await user.click(screen.getByRole('button', { name: 'Mais opções para compartilhar' }))

    expect(share).toHaveBeenCalledWith({
      title: article.title,
      text: article.teaser,
      url: article.url,
    })
  })

  it('speaks European Portuguese and English', () => {
    const { unmount } = renderRow('pt-PT')
    expect(screen.getByRole('button', { name: 'Copiar ligação' })).toBeVisible()
    expect(screen.getByText('Partilhar')).toBeVisible()
    unmount()

    renderRow('en-US')
    expect(screen.getByRole('link', { name: 'Share on WhatsApp' })).toBeVisible()
  })
})
