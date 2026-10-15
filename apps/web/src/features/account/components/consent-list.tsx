import type { Consent } from '@mycogni/contracts'
import { consentKinds, type ConsentKind } from '@mycogni/domain'
import Link from 'next/link'
import { formatLongDate } from '@/shared/lib/time'

const documents: Partial<Record<ConsentKind, '/terms' | '/privacy'>> = {
  terms: '/terms',
  privacy: '/privacy',
}

const labels: Record<ConsentKind, string> = {
  terms: 'Termos de uso',
  privacy: 'Política de privacidade',
  health_data: 'Uso dos seus dados de saúde',
  adult: 'Confirmação de 18 anos ou mais',
  ai_processing: 'Resumos escritos por IA',
}

interface ConsentListProps {
  consents: readonly Consent[]
  timeZone: string
}

export function ConsentList({ consents, timeZone }: ConsentListProps) {
  return (
    <ul>
      {consentKinds.map((kind) => {
        const consent = consents.find((item) => item.kind === kind)
        const document = documents[kind]
        return (
          <li key={kind} className="py-3.5">
            <p>
              {document === undefined ? (
                labels[kind]
              ) : (
                <Link href={document} className="underline decoration-1 underline-offset-4">
                  {labels[kind]}
                </Link>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {consent === undefined
                ? 'Não autorizado'
                : `Autorizado em ${formatLongDate(new Date(consent.grantedAt), timeZone).toLowerCase()}`}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
