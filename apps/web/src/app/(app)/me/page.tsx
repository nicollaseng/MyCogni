import type { Metadata } from 'next'
import { PageTitle } from '@/shared/components/page-title'

export const metadata: Metadata = { title: 'Você' }

export default function MePage() {
  return (
    <>
      <PageTitle title="Você" description="Seus dados, seus lembretes e sua privacidade." />
      <p className="border-t border-rule pt-8 text-muted-foreground">
        Foto, nome, lembretes e a exportação dos seus dados ficam aqui.
      </p>
    </>
  )
}
