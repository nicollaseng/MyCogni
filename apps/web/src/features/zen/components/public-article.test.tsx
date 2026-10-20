import { describe, expect, it, jest } from '@jest/globals'
import type { Locale } from '@mycogni/domain'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test/render'
import { PublicArticle } from './public-article'

const chooseLocale = jest.fn<(locale: Locale) => Promise<void>>(() => Promise.resolve())

describe('PublicArticle', () => {
  it('shows the whole article to visitors with one way to know the app and the crisis lines', () => {
    renderWithIntl(
      <PublicArticle
        id="worry-time"
        shareUrl="http://localhost:3400/articles/worry-time"
        chooseLocale={chooseLocale}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'A hora da preocupação' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Como experimentar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Fontes' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Conheça o MyCogniAI' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'Sono e descanso' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ouvir/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '188' })).toHaveAttribute('href', 'tel:188')
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeVisible()
  })
})
