import type { Metadata } from 'next'
import { PageTitle } from '@/shared/components/page-title'

export const metadata: Metadata = { title: 'Padrões' }

export default function PatternsPage() {
  return (
    <>
      <PageTitle
        title="Padrões"
        description="Depois de duas semanas de registros, você vê aqui como sono, rotina e humor se relacionam."
      />
      <p className="border-t border-rule pt-8 text-muted-foreground">
        Ainda não há registros suficientes.
      </p>
    </>
  )
}
