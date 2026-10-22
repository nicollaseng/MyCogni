import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { finishOnboarding, inviteByLink, verifiedProfessional } from './support/api'
import { choosePhotos, pageBody, photoTiles, saveStatus, startPage, unique } from './support/mybook'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

const photo = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url))
const password = 'mybook-e2e-2026'

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function format(page: Page, name: string): Promise<void> {
  const button = page.getByRole('button', { name, exact: true })
  if (await button.isVisible()) {
    await button.click()
    return
  }
  await page.getByRole('button', { name: 'Formatar texto' }).click()
  await button.click()
  await page.getByRole('button', { name: 'Fechar formatação' }).click()
}

test('writes a page with formatting, a checklist and a photo, finds it and deletes it', async ({
  page,
}) => {
  const title = unique('Dia de sol')
  await startPage(page, title, 'Caminhei até o parque ')

  await format(page, 'Negrito')
  await page.keyboard.type('sem pressa')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Lista de tarefas' }).click()
  await page.keyboard.type('Ligar para a minha irmã')

  const sheet = await choosePhotos(page, photo)
  await expect(sheet.getByRole('button', { name: 'Qualidade: Média' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(photoTiles(page)).toHaveCount(1)
  await expect(saveStatus(page)).toHaveText('Salvo')

  await page.reload()

  await expect(page.getByLabel('Título da página')).toHaveValue(title)
  await expect(pageBody(page).locator('strong')).toHaveText('sem pressa')
  await expect(pageBody(page).getByRole('checkbox')).toHaveCount(1)
  await expect(pageBody(page).getByText('Ligar para a minha irmã', { exact: true })).toBeVisible()
  await expect(
    pageBody(page).getByRole('checkbox', { name: 'Tarefa: Ligar para a minha irmã' }),
  ).not.toBeChecked()
  const image = photoTiles(page).locator('img')
  await expect(image).toBeVisible()
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0)

  await page.getByRole('link', { name: 'MyBook' }).first().click()
  await expect(page).toHaveURL('/mybook')
  await page
    .getByRole('searchbox', { name: 'Buscar no MyBook' })
    .fill(title.split(' ').at(-1) ?? '')
  await expect(page).toHaveURL(/\/mybook\?q=/)
  const found = page.getByRole('link', { name: new RegExp(title) })
  await expect(found).toHaveCount(1)
  await expect(found).toContainText('1 foto')

  await found.click()
  await page.getByRole('button', { name: 'Mais opções' }).click()
  await page.getByRole('button', { name: 'Apagar página' }).click()
  await expect(page.getByText('Apagar esta página e as fotos dela?')).toBeVisible()
  await page.getByRole('button', { name: 'Apagar', exact: true }).click()

  await expect(page).toHaveURL('/mybook')
  await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(0)
})

test('rejects a file that is not a photo', async ({ page }) => {
  await startPage(page, unique('Sem foto'), 'Hoje foi um dia comum.')

  await choosePhotos(page, {
    name: 'notas.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('texto'),
  })

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Escolha uma foto em JPG, PNG, WebP ou GIF.',
  )
  await expect(pageBody(page).locator('img')).toHaveCount(0)
})

test('discards a new page left without writing anything', async ({ page }) => {
  await page.goto('/mybook')
  await page.getByRole('button', { name: 'Nova página' }).click()
  await expect(page).toHaveURL(/\/mybook\/[0-9a-f-]{36}$/)
  const blank = new URL(page.url()).pathname

  await page.getByRole('main').getByRole('link', { name: 'MyBook' }).click()

  await expect(page).toHaveURL('/mybook')
  await page.goto(blank)
  await expect(page.getByRole('heading', { name: 'Esta página não existe.' })).toBeVisible()
})

test.describe('sharing', () => {
  test.use({ storageState: signedOut })

  test('shares a page with a professional, sees when it was read and revokes', async ({
    page,
    browser,
    baseURL,
  }) => {
    const professional = unique('Clara Nunes')
    const professionalEmail = uniqueEmail('pro')
    await verifiedProfessional(professionalEmail, password, professional)
    const { code } = await inviteByLink(professionalEmail, password)
    const patientEmail = uniqueEmail('paciente')
    const patientId = await createUser(patientEmail, password)
    await finishOnboarding(patientEmail, password)

    await signIn(page, patientEmail)
    await page.goto(`/invite/${code}`)
    await page.getByRole('button', { name: 'Ver o convite' }).click()
    await expect(page).toHaveURL(/\/invites\/[0-9a-f-]{36}$/)
    await page.getByRole('button', { name: 'Aceitar', exact: true }).click()
    await expect(page).toHaveURL('/me/professionals')

    const title = unique('Conversa difícil')
    const entryId = await startPage(page, title, 'Consegui dizer o que sentia.')

    await page.getByRole('button', { name: 'Mais opções' }).click()
    await page.getByRole('link', { name: 'Compartilhar esta página' }).click()
    await expect(page).toHaveURL(`/mybook/sharing?page=${entryId}`)
    const panel = page.getByRole('region', { name: professional })
    await expect(panel.getByText('Nada compartilhado')).toBeVisible()
    const sheet = page.getByRole('dialog', { name: `Compartilhar com ${professional}` })
    await expect(sheet.getByRole('checkbox', { name: new RegExp(title) })).toBeChecked()
    await sheet.getByRole('radio', { name: '30 dias' }).check()
    await expect(
      sheet.getByText(`${professional} poderá ler a página “${title}” até`),
    ).toBeVisible()
    await sheet.getByRole('button', { name: 'Compartilhar', exact: true }).click()
    await expect(sheet).toBeHidden()
    await expect(panel.getByText('Páginas escolhidas (1)')).toBeVisible()
    await expect(panel.getByText('Ainda não abriu nenhuma página.')).toBeVisible()

    const reader = await browser.newContext({ baseURL, storageState: signedOut })
    const readerPage = await reader.newPage()
    await signIn(readerPage, professionalEmail)
    await readerPage.goto(`/pro/patients/${patientId}/mybook`)
    await readerPage.getByRole('link', { name: new RegExp(title) }).click()
    await expect(readerPage).toHaveURL(`/pro/patients/${patientId}/mybook/${entryId}`)
    await expect(readerPage.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(readerPage.getByText('Consegui dizer o que sentia.')).toBeVisible()
    await reader.close()

    await page.reload()
    await expect(panel.getByText(`Abriu “${title}” em`)).toBeVisible()

    await panel.getByRole('button', { name: 'Encerrar', exact: true }).click()
    await expect(
      panel.getByText(
        `${professional} deixa de ler o que você compartilhou aqui a partir de agora.`,
      ),
    ).toBeVisible()
    await panel.getByRole('button', { name: 'Encerrar compartilhamento' }).click()
    await expect(panel.getByText('Nada compartilhado')).toBeVisible()
    await panel.getByText('Histórico (1)').click()
    await expect(panel.getByText(/encerrado em/)).toBeVisible()
  })
})
