import type { Metadata } from 'next'
import { PageTitle } from '@/shared/components/page-title'

export const metadata: Metadata = { title: 'Registros' }

export default function EntriesPage() {
  return (
    <>
      <PageTitle
        title="Registros"
        description="Cada check-in fica guardado aqui, com a data, o humor e o que você quiser anotar."
      />
      <p className="border-t border-rule pt-8 text-muted-foreground">
        Seu primeiro registro aparece aqui.
      </p>
    </>
  )
}
