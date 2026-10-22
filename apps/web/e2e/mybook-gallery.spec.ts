import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  finishOnboarding,
  inviteByLink,
  sharePage,
  verifiedProfessional,
} from './support/api'
import {
  choosePhotos,
  paintedPhotos,
  pageBody,
  photoTiles,
  saveStatus,
  startPage,
  unique,
} from './support/mybook'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const password = 'galeria-e2e-2026'

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

test('adds captioned photos to a gallery, then views, edits and deletes them', async ({
  page,
  isMobile,
}) => {
  const title = unique('Praia')
  await startPage(page, title, 'Um dia de mar.')
  const sheet = await choosePhotos(page, await paintedPhotos(page, [150, 30, 210]))

  await sheet.getByRole('textbox', { name: 'Legenda da foto 1 de 3' }).fill('Areia quente')
  await sheet.getByRole('button', { name: 'Foto 2 de 3' }).click()
  await sheet.getByRole('textbox', { name: 'Legenda da foto 2 de 3' }).fill('Ondas')
  await sheet.getByRole('button', { name: 'Adicionar', exact: true }).click()

  const gallery = pageBody(page).getByRole('region', { name: 'Galeria com 3 fotos' })
  await expect(gallery.getByRole('button')).toHaveText(['', '', ''])
  await expect(gallery.getByRole('button', { name: 'Foto 1 de 3: Areia quente' })).toBeVisible()
  await expect(saveStatus(page)).toHaveText('Salvo')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )

  await gallery.getByRole('button', { name: 'Foto 1 de 3: Areia quente' }).click()
  const viewer = page.getByRole('dialog', { name: /^Foto \d de \d$/ })
  await expect(viewer).toHaveAccessibleName('Foto 1 de 3')
  await expect(viewer.getByText('Areia quente')).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await expect(viewer).toHaveAccessibleName('Foto 2 de 3')
  await expect(viewer.getByText('Ondas')).toBeVisible()

  if (!isMobile) {
    const download = page.waitForEvent('download')
    await viewer.getByRole('button', { name: 'Baixar' }).click()
    expect((await download).suggestedFilename()).toMatch(/^mybook-\d{4}-\d{2}-\d{2}-2\.jpg$/)
  }

  await viewer.getByRole('button', { name: 'Editar legenda' }).click()
  await viewer.getByRole('textbox', { name: 'Legenda' }).fill('Ondas no fim da tarde')
  await viewer.getByRole('button', { name: 'Salvar' }).click()
  await expect(viewer.getByText('Ondas no fim da tarde')).toBeVisible()

  await viewer.getByRole('button', { name: 'Apagar' }).click()
  const confirm = page.getByRole('alertdialog', { name: 'Apagar esta foto?' })
  await confirm.getByRole('button', { name: 'Apagar' }).click()
  await expect(viewer).toHaveAccessibleName('Foto 2 de 2')
  await expect(confirm).toBeHidden()

  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  await expect(photoTiles(page)).toHaveCount(2)
  await expect(pageBody(page).getByRole('button', { name: 'Foto 2 de 2' })).toBeFocused()
  await expect(saveStatus(page)).toHaveText('Salvo')

  await page.reload()

  await expect(
    pageBody(page).getByRole('region', { name: 'Galeria com 2 fotos' }).getByRole('button'),
  ).toHaveCount(2)
  await expect(
    pageBody(page).getByRole('button', { name: 'Foto 1 de 2: Areia quente' }),
  ).toBeVisible()

  await page.goto('/mybook')
  await page.getByRole('searchbox', { name: 'Buscar no MyBook' }).fill('Areia quente')
  await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(1)
})

test.describe('a professional reading a shared page', () => {
  test.use({ storageState: signedOut })

  test('opens the photos without any way to change them', async ({ page, browser, baseURL }) => {
    const professionalEmail = uniqueEmail('pro')
    await verifiedProfessional(professionalEmail, password, unique('Clara Nunes'))
    const { code } = await inviteByLink(professionalEmail, password)
    const patientEmail = uniqueEmail('paciente')
    const patientId = await createUser(patientEmail, password)
    await finishOnboarding(patientEmail, password)
    await acceptInvitation(patientEmail, password, code)

    await signIn(page, patientEmail)
    const entryId = await startPage(page, unique('Parque'), 'Uma tarde no parque.')
    const sheet = await choosePhotos(page, await paintedPhotos(page, [90]))
    await sheet.getByRole('textbox', { name: 'Legenda da foto 1 de 1' }).fill('Banco da praça')
    await sheet.getByRole('button', { name: 'Adicionar', exact: true }).click()
    await expect(photoTiles(page)).toHaveCount(1)
    await expect(saveStatus(page)).toHaveText('Salvo')
    await sharePage(patientEmail, password, entryId)

    const reader = await browser.newContext({ baseURL, storageState: signedOut })
    const readerPage = await reader.newPage()
    await signIn(readerPage, professionalEmail)
    await readerPage.goto(`/pro/patients/${patientId}/mybook/${entryId}`)

    await readerPage.getByRole('button', { name: 'Foto 1 de 1: Banco da praça' }).click()
    const viewer = readerPage.getByRole('dialog', { name: 'Foto 1 de 1' })
    await expect(viewer.getByText('Banco da praça')).toBeVisible()
    for (const name of ['Baixar', 'Editar legenda', 'Apagar']) {
      await expect(viewer.getByRole('button', { name })).toHaveCount(0)
    }
    await readerPage.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
    await reader.close()
  })
})
