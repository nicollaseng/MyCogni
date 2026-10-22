import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding } from './support/api'
import {
  choosePhotos,
  paintedPhotos,
  photoTiles,
  saveStatus,
  startPage,
  unique,
} from './support/mybook'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const password = 'fotos-e2e-2026'

test.use({ storageState: signedOut })

async function newPerson(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile) {
    await page.setViewportSize({ width: 375, height: 812 })
  }
  const email = uniqueEmail('fotos')
  await createUser(email, password)
  await finishOnboarding(email, password)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/today')
}

async function pageWithPhotos(
  page: Page,
  title: string,
  hues: readonly number[],
  captions: readonly string[],
): Promise<string> {
  const id = await startPage(page, title, 'Um dia para lembrar.')
  const sheet = await choosePhotos(page, await paintedPhotos(page, hues))
  for (const [index, caption] of captions.entries()) {
    if (index > 0) {
      await sheet
        .getByRole('button', { name: `Foto ${String(index + 1)} de ${String(hues.length)}` })
        .click()
    }
    await sheet
      .getByRole('textbox', {
        name: `Legenda da foto ${String(index + 1)} de ${String(hues.length)}`,
      })
      .fill(caption)
  }
  await sheet.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(photoTiles(page)).toHaveCount(hues.length)
  await expect(saveStatus(page)).toHaveText('Salvo')
  return id
}

function noSideScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}

test('shows every photo in one place, opens them and changes them on their pages', async ({
  page,
  isMobile,
}) => {
  await newPerson(page, isMobile)
  const beach = unique('Praia')
  const beachId = await pageWithPhotos(page, beach, [150, 30], ['Areia'])
  await pageWithPhotos(page, unique('Parque'), [210], ['Banco da praça'])

  await page.goto('/mybook')
  await page
    .getByRole('navigation', { name: 'Ver o MyBook por' })
    .getByRole('link', { name: 'Fotos' })
    .click()
  await expect(page).toHaveURL('/mybook/photos')

  const grid = page.getByRole('region', { name: 'Fotos do MyBook' })
  await expect(grid.getByRole('button')).toHaveCount(3)
  await expect(grid.getByRole('button').first()).toHaveAccessibleName('Banco da praça')
  expect(await noSideScroll(page)).toBe(true)

  await grid.getByRole('button', { name: 'Areia' }).click()
  const viewer = page.getByRole('dialog', { name: /^Foto \d de \d$/ })
  await expect(viewer).toHaveAccessibleName('Foto 2 de 3')
  await expect(viewer.getByText(new RegExp(`· ${beach}$`))).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await expect(viewer).toHaveAccessibleName('Foto 3 de 3')
  await viewer.getByRole('button', { name: 'Editar legenda' }).click()
  await viewer.getByRole('textbox', { name: 'Legenda' }).fill('Ondas')
  await viewer.getByRole('button', { name: 'Salvar' }).click()
  await expect(viewer.getByText('Ondas', { exact: true })).toBeVisible()

  await viewer.getByRole('button', { name: 'Apagar' }).click()
  const confirm = page.getByRole('alertdialog', { name: 'Apagar esta foto?' })
  await confirm.getByRole('button', { name: 'Apagar' }).click()
  await expect(viewer).toHaveAccessibleName('Foto 2 de 2')
  await expect(confirm).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(grid.getByRole('button')).toHaveCount(2)

  await grid.getByRole('button', { name: 'Areia' }).click()
  await viewer.getByRole('button', { name: 'Abrir página' }).click()
  await expect(page).toHaveURL(new RegExp(`/mybook/${beachId}#photo=`))
  const tile = page.getByRole('button', { name: 'Foto 1 de 1: Areia' })
  await expect(tile).toBeInViewport()
  await expect(tile).toBeFocused()
})

test('says where photos will appear before there are any', async ({ page, isMobile }) => {
  await newPerson(page, isMobile)
  await page.goto('/mybook/photos')

  await expect(page.getByText('As fotos que você colocar nas páginas aparecem aqui.')).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Ver o MyBook por' }).getByRole('link', { name: 'Fotos' }),
  ).toHaveAttribute('aria-current', 'page')
})
