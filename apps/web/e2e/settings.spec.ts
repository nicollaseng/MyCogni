import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, setPhoto, verifiedProfessional } from './support/api'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const password = 'secoes-2026'

const photo = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url))

const sections = [
  ['Ânimo e ansiedade', '/me/wellbeing'],
  ['Profissionais', '/me/professionals'],
  ['Memórias', '/me/memories'],
  ['Som e voz', '/me/sound'],
  ['Privacidade e dados', '/me/privacy'],
  ['Conta', '/me/account'],
  ['Suporte', '/me/support'],
] as const

function sectionNav(page: Page) {
  return page.getByRole('navigation', { name: 'Seções de perfil e configurações' })
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL('/sign-in')
}

test('lists the sections on a phone and opens each on its own page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The list is the phone layout')
  await page.goto('/me')

  for (const [name, path] of sections) {
    await sectionNav(page).getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(sectionNav(page)).toHaveCount(0)
    await page.getByRole('link', { name: 'Configurações', exact: true }).click()
    await expect(page).toHaveURL('/me')
  }

  await sectionNav(page).getByRole('link').first().click()
  await expect(page).toHaveURL('/me/profile')
  await expect(page.getByRole('heading', { level: 1, name: 'Perfil' })).toBeVisible()
})

test('keeps the sections beside the open one on a computer', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The side navigation is the computer layout')
  await page.goto('/me')
  const nav = sectionNav(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Perfil' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Perfil', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )

  for (const [name, path] of sections) {
    await nav.getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
  }
  await expect(page.getByRole('link', { name: 'Configurações', exact: true })).toHaveCount(0)
})

test('sends the old anchor links to their sections', async ({ page }) => {
  for (const [anchor, path, name] of [
    ['professionals', '/me/professionals', 'Profissionais'],
    ['support', '/me/support', 'Suporte'],
    ['questionnaires', '/me/wellbeing', 'Ânimo e ansiedade'],
  ] as const) {
    await page.goto(`/me#${anchor}`)
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  }

  await page.goto('/today')
  await page.getByRole('button', { name: 'Sua conta' }).click()
  await page.getByRole('menuitem', { name: 'Profissionais' }).click()
  await expect(page).toHaveURL('/me/professionals')

  await page.goto('/me')
  await page.getByRole('button', { name: 'Sua conta' }).click()
  await page.getByRole('menuitem', { name: 'Suporte' }).click()
  await expect(page).toHaveURL('/me/support')
  await expect(page.getByRole('menu', { name: 'Conta' })).toHaveCount(0)
})

test.describe('the profile photo', () => {
  test.use({ storageState: signedOut })

  test('shows an edit hint, opens full screen and asks before removing', async ({
    page,
    isMobile,
  }) => {
    const email = uniqueEmail('secoes-foto')
    await createUser(email, password)
    await finishOnboarding(email, password)
    await setPhoto(email, password, await readFile(photo))
    await signIn(page, email)
    await page.goto('/me/profile')

    const avatar = page.getByRole('button', { name: 'Foto do perfil' })
    const hover = avatar.locator('[data-overlay="hover"]')
    const badge = avatar.locator('[data-overlay="badge"]')
    if (isMobile) {
      await expect(badge).toBeVisible()
      await expect(hover).toBeHidden()
    } else {
      await expect(badge).toBeHidden()
      await expect(hover).toHaveCSS('opacity', '0')
      await avatar.hover()
      await expect(hover).toHaveCSS('opacity', '1')
    }

    await avatar.click()
    const viewer = page.getByRole('dialog', { name: 'Foto do perfil' })
    await expect(viewer.getByRole('img', { name: 'Sua foto' })).toBeVisible()
    await viewer.getByRole('button', { name: 'Editar' }).click()
    const editor = page.getByRole('dialog', { name: 'Ajustar foto' })
    await expect(editor).toBeVisible()
    await expect(editor.getByText('Escolher outra foto')).toBeVisible()
    await editor.getByRole('button', { name: 'Cancelar' }).click()
    await expect(editor).toHaveCount(0)

    await viewer.getByRole('button', { name: 'Remover' }).click()
    const confirm = page.getByRole('alertdialog', { name: 'Remover a foto do perfil?' })
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Cancelar' }).click()
    await expect(confirm).toHaveCount(0)
    await expect(viewer.getByRole('img', { name: 'Sua foto' })).toBeVisible()

    await viewer.getByRole('button', { name: 'Remover' }).click()
    await confirm.getByRole('button', { name: 'Remover' }).click()
    await expect(confirm).toHaveCount(0)
    await expect(viewer).toContainText('Foto removida.')
    await expect(viewer.getByRole('img')).toHaveCount(0)
    await expect(viewer.getByText('Adicionar foto')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(viewer).toHaveCount(0)
    await expect(avatar).toBeFocused()
    await page.reload()
    await expect(avatar.locator('img')).toHaveCount(0)
  })

  test('opens the same viewer from the professional settings', async ({ page }) => {
    const email = uniqueEmail('secoes-pro')
    await verifiedProfessional(email, password, 'Helena Prado')
    await signIn(page, email)
    await page.goto('/pro/settings')

    await page.getByRole('button', { name: 'Foto do perfil' }).click()
    const viewer = page.getByRole('dialog', { name: 'Foto do perfil' })
    await expect(viewer.getByText('Adicionar foto')).toBeVisible()
    await expect(viewer.getByRole('button', { name: 'Remover' })).toHaveCount(0)
    await viewer.getByRole('button', { name: 'Fechar' }).click()
    await expect(viewer).toHaveCount(0)
  })
})
