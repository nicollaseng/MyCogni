import { expect, test } from '@playwright/test'
import { signedOut } from './support/session'

const article = '/articles/worry-time'

test.describe('public article', () => {
  test.use({ storageState: signedOut })

  test('lets a visitor read a shared article and find the app', async ({ page }) => {
    await page.goto(article)

    await expect(
      page.getByRole('heading', { level: 1, name: 'A hora da preocupação' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Como experimentar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Conheça o MyCogniAI' })).toHaveAttribute(
      'href',
      '/',
    )
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/articles\/worry-time\/image\?lang=pt-BR$/,
    )
  })

  test('serves the article and its preview image without a session, and keeps the app closed', async ({
    request,
  }) => {
    const page = await request.get(article, { headers: { 'accept-language': 'pt-BR' } })
    expect(page.status()).toBe(200)
    expect(await page.text()).toContain('A hora da preocupação')

    const image = await request.get(`${article}/image?lang=pt-BR`)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toBe('image/png')

    const app = await request.get('/zen/articles/worry-time', { maxRedirects: 0 })
    expect(app.status()).toBe(307)
    expect(app.headers().location).toMatch(/\/sign-in$/)

    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Allow: /articles/')
    expect(robots).toContain('Disallow: /zen')
  })
})

test.describe('article in the app', () => {
  test('shares the public link and confirms the copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/zen/articles/worry-time')

    const whatsapp = page.getByRole('link', { name: 'Compartilhar no WhatsApp' })
    await expect(whatsapp).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/\?text=A%20hora%20da%20preocupa%C3%A7%C3%A3o%20%E2%80%94%20/,
    )
    expect(await whatsapp.getAttribute('href')).toMatch(/%2Farticles%2Fworry-time$/)
    await expect(page.getByRole('link', { name: 'Compartilhar por e-mail' })).toHaveAttribute(
      'href',
      /^mailto:\?subject=A%20hora%20da%20preocupa%C3%A7%C3%A3o&body=/,
    )

    await page.getByRole('button', { name: 'Copiar link' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Link copiado' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
      /\/articles\/worry-time$/,
    )
  })

  test('opens the in-app article when a signed-in person follows a shared link', async ({
    page,
  }) => {
    await page.goto(article)

    await expect(page).toHaveURL('/zen/articles/worry-time')
    await expect(page.getByRole('link', { name: /Voltar|Zen/ }).first()).toBeVisible()
  })
})
