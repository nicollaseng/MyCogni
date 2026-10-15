import { expect, test, type Page } from '@playwright/test'
import {
  acceptInvitation,
  allowSummaries,
  finishOnboarding,
  inviteByLink,
  recordCheckIns,
  verifiedProfessional,
} from './support/api'
import { seedPatientInsight, seedProfessionalInsight } from './support/database'
import { signedOut } from './support/session'
import { createUser, uniqueEmail } from './support/supabase'

test.use({ storageState: signedOut })

const password = 'resumos-e2e-2026'

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}

async function readyPerson(prefix: string): Promise<{ email: string; id: string }> {
  const email = uniqueEmail(prefix)
  const id = await createUser(email, password)
  await finishOnboarding(email, password)
  return { email, id }
}

const latestContent = {
  summary:
    'Sua semana terminou mais leve do que começou. O trabalho ainda aparece como o contexto que mais pesa.',
  highlights: ['Os dias com exercício tiveram o humor mais alto do período.'],
  suggestions: [
    {
      title: 'Proteger o horário de dormir',
      detail: 'As noites bem dormidas vieram antes dos seus melhores dias.',
    },
  ],
}

const earlierContent = {
  summary: 'Uma semana de altos e baixos, com uma discussão em casa no ponto mais baixo.',
  highlights: ['A caminhada apareceu nos dois melhores dias.'],
  suggestions: [{ title: 'Repetir a caminhada', detail: 'Vale tentar duas vezes por semana.' }],
}

test('shows the latest reading on Hoje and Padrões and opens an earlier one from its link', async ({
  page,
}) => {
  const person = await readyPerson('resumo')
  const earlierId = await seedPatientInsight({
    patientId: person.id,
    daysAgo: 9,
    checkInCount: 7,
    content: earlierContent,
  })
  const latestId = await seedPatientInsight({
    patientId: person.id,
    daysAgo: 1,
    checkInCount: 8,
    content: latestContent,
  })
  await signIn(page, person.email)

  const teaser = page.getByRole('region', { name: 'Seu último resumo' })
  await expect(teaser).toContainText('Sua semana terminou mais leve do que começou.')
  await expect(teaser).not.toContainText('O trabalho ainda aparece')
  await teaser.getByRole('link', { name: 'Ler o resumo completo' }).click()

  await expect(page).toHaveURL(`/patterns#reading-${latestId}`)
  const readings = page.getByRole('region', { name: 'Resumo automático' })
  await expect(readings).toContainText('8 registros')
  await expect(readings.getByText(latestContent.summary)).toBeVisible()
  await expect(readings).toContainText(
    'Os dias com exercício tiveram o humor mais alto do período.',
  )
  await expect(readings).toContainText('Proteger o horário de dormir')
  await expect(page.getByText(earlierContent.summary)).toBeHidden()
  await readings.getByRole('button', { name: 'Fechar resumo' }).click()
  await expect(readings.getByRole('button', { name: 'Ler resumo' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(
    readings.getByText('Sua semana terminou mais leve do que começou.', { exact: true }),
  ).toBeVisible()

  await page.goto(`/patterns#reading-${earlierId}`)

  const earlier = page.locator(`#reading-${earlierId}`).getByRole('button')
  await expect(earlier).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText(earlierContent.summary)).toBeVisible()
  await earlier.click()
  await expect(earlier).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText(earlierContent.summary)).toBeHidden()
})

test('explains the first reading and counts the records toward it', async ({ page }) => {
  const person = await readyPerson('sem-resumo')
  await signIn(page, person.email)

  await expect(page.getByRole('region', { name: 'Seu último resumo' })).toHaveCount(0)
  await page.goto('/patterns')
  const upcoming = page.getByRole('region', { name: 'Em breve' })
  await expect(upcoming.getByText('Resumo automático')).toHaveCount(0)

  await allowSummaries(person.email, password)
  await recordCheckIns(
    person.email,
    password,
    Array.from({ length: 3 }, () => ({ moodLevel: 4, emotions: [], contexts: [], note: null })),
  )
  await page.reload()

  await expect(upcoming).toContainText('Resumo automático3 de 7 registros')
})

test('lets the person include MyBook in the readings', async ({ page }) => {
  const person = await readyPerson('mybook-resumo')
  await signIn(page, person.email)
  await page.goto('/me')
  const privacy = page.getByRole('region', { name: 'Privacidade' })
  const toggle = privacy.getByRole('switch', { name: 'Incluir o MyBook nos meus resumos' })

  await expect(privacy).toContainText('os resumos para o profissional nunca usam o MyBook')
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    toggle.click(),
  ])
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')

  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST'),
    toggle.click(),
  ])
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
})

test('shows the professional reading with its attention level on the patient file', async ({
  page,
}) => {
  const professionalEmail = uniqueEmail('pro-resumo')
  const professionalId = await verifiedProfessional(
    professionalEmail,
    password,
    'Dra. Helena Prado',
  )
  const patient = await readyPerson('paciente-resumo')
  const { code } = await inviteByLink(professionalEmail, password)
  await acceptInvitation(patient.email, password, code)
  await seedProfessionalInsight({
    patientId: patient.id,
    professionalId,
    daysAgo: 9,
    checkInCount: 7,
    content: {
      summary: 'Humor estável no período, sem conteúdo de risco.',
      trends: ['Média de humor 3,3.'],
      themes: ['Família'],
      attention: 'none',
      attentionReason: null,
    },
  })
  await seedProfessionalInsight({
    patientId: patient.id,
    professionalId,
    daysAgo: 1,
    checkInCount: 7,
    content: {
      summary: 'Melhora consistente do humor, com sono restaurado.',
      trends: ['Média de humor 4,1, alta de 0,8.'],
      themes: ['Sono', 'Trabalho'],
      attention: 'watch',
      attentionReason: 'Preocupação com trabalho em três registros seguidos.',
    },
  })
  await signIn(page, professionalEmail)
  await page.goto(`/pro/patients/${patient.id}`)

  const readings = page.getByRole('region', { name: 'Resumos', exact: true })
  await expect(readings).toContainText('Não fazem diagnóstico.')
  await expect(readings.locator('[data-attention="watch"]').first()).toContainText('Observar')
  await expect(readings).toContainText('Preocupação com trabalho em três registros seguidos.')
  await expect(readings).toContainText('Melhora consistente do humor, com sono restaurado.')
  await expect(readings).toContainText('Média de humor 4,1, alta de 0,8.')
  await expect(readings).toContainText('Trabalho')

  const earlier = page.getByRole('region', { name: 'Resumos anteriores' })
  await expect(earlier).toContainText('Sem sinais de atenção')
  await expect(page.getByText('Humor estável no período, sem conteúdo de risco.')).toBeHidden()
  await earlier.getByRole('button').first().click()
  await expect(page.getByText('Humor estável no período, sem conteúdo de risco.')).toBeVisible()
})
