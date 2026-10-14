import { expect, test } from '@playwright/test'
import { signedOut } from './support/session'
import { supabaseUrl } from './support/supabase'

test.use({ storageState: signedOut })

for (const path of ['/sign-in', '/sign-up']) {
  test(`sends ${path} to the Google account picker through Supabase`, async ({ page }) => {
    let authorize: URL | undefined
    let google: URL | undefined
    await page.route(`${supabaseUrl}/auth/v1/authorize**`, async (route) => {
      authorize = new URL(route.request().url())
      const response = await route.fetch({ maxRedirects: 0 })
      google = new URL(response.headers().location ?? 'about:blank')
      await route.fulfill({ contentType: 'text/html', body: '<title>Google</title>' })
    })
    await page.goto(path)

    await page.getByRole('button', { name: 'Continuar com o Google' }).click()

    await expect.poll(() => google?.origin).toBe('https://accounts.google.com')
    expect(authorize?.searchParams.get('provider')).toBe('google')
    expect(authorize?.searchParams.get('redirect_to')).toBe('http://localhost:3000/auth/callback')
    expect(google?.pathname).toBe('/o/oauth2/v2/auth')
    expect(google?.searchParams.get('redirect_uri')).toBe(`${supabaseUrl}/auth/v1/callback`)
    expect(google?.searchParams.get('prompt')).toBe('select_account')
    expect(google?.searchParams.get('scope')).toContain('email')
  })
}

test('says when coming back from Google fails', async ({ page }) => {
  await page.goto('/auth/callback?code=not-a-real-code')

  await expect(page).toHaveURL('/sign-in?error=oauth')
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Não foi possível entrar com o Google. Tente de novo.',
  )
})
